import React, { useEffect, useState } from 'react';

type Meme = { id: string; name: string; url: string };
let cached: Meme[] = [];
const emojis = [
  '😀',
  '😂',
  '🥹',
  '😍',
  '🥰',
  '😘',
  '😎',
  '🤔',
  '🙃',
  '😭',
  '😤',
  '🫠',
  '🤯',
  '🥳',
  '👍',
  '👎',
  '👏',
  '🙏',
  '🤝',
  '💪',
  '❤️',
  '💕',
  '💔',
  '🔥',
  '✨',
  '🎉',
  '🌹',
  '☕',
  '🐱',
  '🐶',
  '🐼',
  '💩'
];
const aliases: Record<string, string> = {
  猫: 'cat',
  狗: 'dog',
  开心: 'happy',
  笑: 'laugh smiling',
  哭: 'cry sad',
  生气: 'angry',
  惊讶: 'surprise shocked',
  熊猫: 'panda',
  思考: 'think',
  拒绝: 'drake',
  纠结: 'buttons',
  男友: 'boyfriend'
};
export default function StickerPicker({
  insert,
  upload,
  close
}: {
  insert: (value: string, name?: string) => void;
  upload: () => void;
  close: () => void;
}) {
  const [tab, setTab] = useState<'emoji' | 'web'>('emoji');
  const [memes, setMemes] = useState(cached);
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (tab !== 'web' || cached.length) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    let active = true;
    setStatus('正在加载网络热门表情…');
    fetch('https://api.imgflip.com/get_memes?type=gif,image', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!data.success || !Array.isArray(data.data?.memes)) throw new Error();
        const items = data.data.memes.filter(
          (item: Meme) =>
            typeof item.name === 'string' && /^https:\/\/i\.imgflip\.com\//.test(item.url)
        );
        if (active) {
          cached = items;
          setMemes(items);
          setStatus('');
        }
      })
      .catch(() => {
        if (active) setStatus('网络表情暂时无法加载，可以重试或上传自己的 GIF / JPG。');
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [tab, retry]);
  const terms = (aliases[query.trim()] || query).toLowerCase().split(/\s+/).filter(Boolean);
  const matches = memes.filter(
    (item) => !terms.length || terms.some((term) => item.name.toLowerCase().includes(term))
  );
  return (
    <section className="journal-stickers" aria-label="表情包面板">
      <div className="sticker-actions">
        <button type="button" aria-pressed={tab === 'emoji'} onClick={() => setTab('emoji')}>
          常用表情
        </button>
        <button type="button" aria-pressed={tab === 'web'} onClick={() => setTab('web')}>
          网络热门
        </button>
        <button type="button" onClick={upload}>
          上传 GIF / JPG
        </button>
        <button type="button" onClick={close}>
          关闭
        </button>
      </div>
      {tab === 'emoji' ? (
        <div className="emoji-grid">
          {emojis.map((emoji) => (
            <button
              type="button"
              key={emoji}
              aria-label={`插入 ${emoji}`}
              onClick={() => insert(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <>
          <input
            aria-label="搜索网络表情"
            placeholder="搜索热门库：猫、狗、开心、drake…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {status && (
            <p role="status">
              {status}{' '}
              <button type="button" onClick={() => setRetry((n) => n + 1)}>
                重试
              </button>
            </p>
          )}
          {!status && !matches.length && <p>没有匹配的表情，试试英文关键词，或上传自己的收藏。</p>}
          <div className="meme-grid">
            {matches.map((meme) => (
              <button
                type="button"
                key={meme.id}
                title={meme.name}
                aria-label={`插入表情包 ${meme.name}`}
                onClick={() => insert(meme.url, meme.name)}
              >
                <img loading="lazy" src={meme.url} alt={meme.name} />
                <span>{meme.name}</span>
              </button>
            ))}
          </div>
          <small>热门库来自 Imgflip，可搜索模板名称；插入的图片使用原站链接。</small>
        </>
      )}
      <form
        className="sticker-url"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^https:\/\/\S+$/i.test(url)) {
            insert(url, '表情包');
            setUrl('');
          }
        }}
      >
        <input
          aria-label="表情包图片链接"
          type="url"
          pattern="https://.*"
          required
          placeholder="粘贴 GIF / JPG 图片直链（https://）"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">插入图片</button>
      </form>
    </section>
  );
}
