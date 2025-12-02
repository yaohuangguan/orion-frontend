
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';

// --- MOCK DATA FOR MUSIC SEARCH ---
const DEMO_SONGS = [
  { id: 1, title: 'Lofi Study Beat 1', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3' },
  { id: 2, title: 'Relaxing Rain', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_07364d50c5.mp3?filename=rain-and-nostalgia-110236.mp3' },
  { id: 3, title: 'Ambient Space', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc8c6c2e35.mp3?filename=ambient-piano-10114.mp3' },
];

// --- SPACE SHOOTER COMPONENT ---
const SpaceShooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const { t } = useTranslation();

  // Game state refs to avoid closure staleness in loop
  const gameState = useRef({
    playerX: 150,
    bullets: [] as { x: number, y: number }[],
    enemies: [] as { x: number, y: number }[],
    frame: 0,
    gameOver: false
  });

  const stopGame = () => {
    setIsPlaying(false);
    gameState.current.gameOver = true;
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    gameState.current = {
      playerX: 150,
      bullets: [],
      enemies: [],
      frame: 0,
      gameOver: false
    };
    if (canvasRef.current) canvasRef.current.focus();
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      state.frame++;
      
      // Update
      // Spawn enemies
      if (state.frame % 60 === 0) {
        state.enemies.push({ x: Math.random() * (canvas.width - 20), y: -20 });
      }

      // Move bullets
      state.bullets = state.bullets.filter(b => b.y > 0);
      state.bullets.forEach(b => b.y -= 5);

      // Move enemies
      state.enemies.forEach(e => e.y += 2);
      
      // Collision Player
      const playerRect = { x: state.playerX, y: canvas.height - 30, w: 20, h: 20 };
      for (const e of state.enemies) {
        if (
            e.x < playerRect.x + playerRect.w &&
            e.x + 20 > playerRect.x &&
            e.y < playerRect.y + playerRect.h &&
            e.y + 20 > playerRect.y
        ) {
           stopGame();
        }
        if (e.y > canvas.height) stopGame(); // Enemy passed
      }

      // Collision Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const b = state.bullets[i];
          const e = state.enemies[j];
          if (!b || !e) continue;
          if (b.x > e.x && b.x < e.x + 20 && b.y > e.y && b.y < e.y + 20) {
             state.bullets.splice(i, 1);
             state.enemies.splice(j, 1);
             setScore(s => s + 10);
             break;
          }
        }
      }

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Player
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(state.playerX + 10, canvas.height - 30);
      ctx.lineTo(state.playerX + 20, canvas.height);
      ctx.lineTo(state.playerX, canvas.height);
      ctx.fill();

      // Enemies
      ctx.fillStyle = '#ef4444';
      state.enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, 20, 20);
      });

      // Bullets
      ctx.fillStyle = '#fbbf24';
      state.bullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y, 4, 8);
      });

      animId = requestAnimationFrame(loop);
    };

    loop();

    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'ArrowLeft') gameState.current.playerX = Math.max(0, gameState.current.playerX - 20);
       if (e.key === 'ArrowRight') gameState.current.playerX = Math.min(canvas.width - 20, gameState.current.playerX + 20);
       if (e.key === ' ') {
         gameState.current.bullets.push({ x: gameState.current.playerX + 10, y: canvas.height - 30 });
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-4 h-full relative overflow-hidden">
       {!isPlaying && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
           <h3 className="text-3xl font-display font-bold text-white mb-2">{t.privateSpace.leisure.spaceShooter}</h3>
           {score > 0 && <p className="text-amber-400 font-mono mb-4">{t.privateSpace.leisure.score}: {score}</p>}
           <p className="text-slate-400 text-xs mb-6 font-mono">{t.privateSpace.leisure.instructions}</p>
           <button onClick={startGame} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">
             {t.privateSpace.leisure.startGame}
           </button>
         </div>
       )}
       <canvas 
         ref={canvasRef} 
         width={300} 
         height={400} 
         className="bg-slate-800 rounded-lg shadow-inner w-full h-full object-contain"
       />
       {isPlaying && (
         <div className="absolute top-4 left-4 text-white font-mono font-bold">
           {t.privateSpace.leisure.score}: {score}
         </div>
       )}
    </div>
  );
};

// --- KLOTSKI (Hua Rong Dao) COMPONENT ---
// Simplified Number Sliding Puzzle Version for Stability
const Klotski: React.FC = () => {
  const [grid, setGrid] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]); // 0 is empty
  const { t } = useTranslation();

  const isSolvable = (arr: number[]) => {
    let inv = 0;
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++)
        if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
    return inv % 2 === 0;
  };

  const shuffle = () => {
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    do {
      arr = arr.sort(() => Math.random() - 0.5);
    } while (!isSolvable(arr));
    setGrid(arr);
  };

  const move = (idx: number) => {
    const emptyIdx = grid.indexOf(0);
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;

    if (Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1) {
      const newGrid = [...grid];
      [newGrid[idx], newGrid[emptyIdx]] = [newGrid[emptyIdx], newGrid[idx]];
      setGrid(newGrid);
    }
  };

  const isWin = grid.join('') === '123456780';

  return (
    <div className="flex flex-col items-center justify-center bg-amber-50 rounded-2xl p-4 h-full relative">
       <div className="absolute top-4 right-4">
         <button onClick={shuffle} className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 hover:bg-amber-300 transition-colors">
            <i className="fas fa-redo text-xs"></i>
         </button>
       </div>
       <h3 className="text-xl font-bold text-amber-800 mb-6 font-display">{t.privateSpace.leisure.klotski}</h3>
       
       <div className="grid grid-cols-3 gap-2 bg-amber-200 p-2 rounded-xl shadow-inner">
          {grid.map((num, i) => (
             <div 
               key={i} 
               onClick={() => move(i)}
               className={`w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-lg cursor-pointer transition-all ${
                 num === 0 
                   ? 'invisible' 
                   : 'bg-white text-amber-800 shadow-md hover:-translate-y-0.5 border-b-4 border-amber-300'
               }`}
             >
               {num}
             </div>
          ))}
       </div>
       {isWin && <div className="mt-4 text-emerald-600 font-bold uppercase tracking-widest animate-bounce">Complete!</div>}
    </div>
  );
};

export const LeisureSpace: React.FC = () => {
  const { t } = useTranslation();
  const [audioUrl, setAudioUrl] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Custom Music Player Handlers
  const playUrl = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      setAudioUrl(url);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const filteredSongs = DEMO_SONGS.filter(s => s.title.toLowerCase().includes(searchInput.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full lg:overflow-hidden min-h-[600px]">
      
      {/* LEFT COLUMN: Music Player */}
      <div className="bg-white/70 rounded-[2rem] p-6 border border-white shadow-xl backdrop-blur-md flex flex-col h-full">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
               <i className="fas fa-compact-disc text-xl animate-spin-slow"></i>
            </div>
            <div>
               <h2 className="text-2xl font-display font-bold text-slate-800">{t.privateSpace.leisure.musicTitle}</h2>
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                 <span className="text-xs text-slate-500 font-mono uppercase">
                    {isPlaying ? t.privateSpace.leisure.nowPlaying : t.privateSpace.leisure.stopped}
                 </span>
               </div>
            </div>
         </div>

         {/* Player Controls */}
         <div className="bg-slate-900 rounded-3xl p-6 mb-6 text-white shadow-2xl relative overflow-hidden group">
            {/* Visualizer BG */}
            <div className="absolute inset-0 opacity-20 flex items-end justify-between px-2 gap-1 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div key={i} className={`w-full bg-indigo-500 transition-all duration-300 ${isPlaying ? 'animate-bounce' : 'h-1'}`} style={{ height: isPlaying ? `${Math.random() * 100}%` : '2px', animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>

            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
            
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-4">
               <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-inner">
                  <i className="fas fa-music text-3xl opacity-50"></i>
               </div>
               <div className="flex items-center gap-6">
                  <button className="text-slate-400 hover:text-white transition-colors"><i className="fas fa-backward"></i></button>
                  <button 
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center text-2xl transition-all shadow-lg shadow-indigo-500/30 hover:scale-105"
                  >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play pl-1'}`}></i>
                  </button>
                  <button className="text-slate-400 hover:text-white transition-colors"><i className="fas fa-forward"></i></button>
               </div>
            </div>
         </div>

         {/* Inputs */}
         <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
            {/* URL Input */}
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-slate-400 ml-1">{t.privateSpace.leisure.playUrl}</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={audioUrl}
                   onChange={(e) => setAudioUrl(e.target.value)}
                   placeholder={t.privateSpace.leisure.placeholderUrl}
                   className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                 />
                 <button 
                   onClick={() => playUrl(audioUrl)}
                   className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors"
                 >
                   <i className="fas fa-arrow-right"></i>
                 </button>
               </div>
            </div>

            {/* Search / List */}
            <div className="flex-1 min-h-0 flex flex-col">
               <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-2">{t.privateSpace.leisure.search}</label>
               <input 
                 type="text" 
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 placeholder={t.privateSpace.leisure.placeholderSearch}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
               />
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredSongs.map(song => (
                    <div 
                      key={song.id}
                      onClick={() => playUrl(song.url)}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 cursor-pointer border border-transparent hover:border-indigo-100 transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 text-xs font-bold">
                            {song.id}
                          </div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{song.title}</span>
                       </div>
                       <i className="fas fa-play-circle text-slate-300 group-hover:text-indigo-400 text-xl"></i>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT COLUMN: Games */}
      <div className="flex flex-col gap-6 h-full min-h-[500px]">
        {/* Game 1: Space Shooter */}
        <div className="flex-1 min-h-0">
           <SpaceShooter />
        </div>
        
        {/* Game 2: Klotski */}
        <div className="flex-1 min-h-0">
           <Klotski />
        </div>
      </div>
    </div>
  );
};
