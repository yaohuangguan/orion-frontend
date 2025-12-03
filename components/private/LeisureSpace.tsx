import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

// --- MOCK DATA FOR MUSIC SEARCH ---
const DEMO_SONGS = [
  { id: 1, title: 'Lofi Study Beat 1', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3' },
  { id: 2, title: 'Relaxing Rain', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_07364d50c5.mp3?filename=rain-and-nostalgia-110236.mp3' },
  { id: 3, title: 'Ambient Space', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc8c6c2e35.mp3?filename=ambient-piano-10114.mp3' },
  { id: 4, title: 'Pirate Chantey', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d0.mp3?filename=pirate-15828.mp3' },
];

// --- DIGITAL CLOCK COMPONENT ---
const DigitalClock: React.FC = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number, code: number } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Update Time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Shenzhen Weather (Open-Meteo)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordinates for Shenzhen: 22.5431° N, 114.0579° E
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=22.5431&longitude=114.0579&current=temperature_2d,weather_code&timezone=auto');
        
        if (!res.ok) {
           throw new Error(`Weather API returned ${res.status}`);
        }

        const data = await res.json();

        // Safety check to prevent "Cannot read properties of undefined"
        if (!data || !data.current) {
            throw new Error('Invalid weather data structure');
        }

        setWeather({
            temp: data.current.temperature_2d,
            code: data.current.weather_code
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
        // Fallback to null (or keep previous state) so UI doesn't break
        setWeather(null);
      } finally {
        setLoadingWeather(false);
      }
    };
    
    fetchWeather();
    // Refresh weather every 30 mins
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Helpers
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false }); // 24-hour format
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  };

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes (http://www.wmo.int/pages/prog/www/IMOP/publications/CIMO-Guide/CIMO_Guide-7th_Edition-2008.html)
    if (code === 0) return 'fa-sun'; // Clear
    if (code >= 1 && code <= 3) return 'fa-cloud-sun'; // Partly cloudy
    if (code >= 45 && code <= 48) return 'fa-smog'; // Fog
    if (code >= 51 && code <= 67) return 'fa-cloud-rain'; // Drizzle/Rain
    if (code >= 71 && code <= 77) return 'fa-snowflake'; // Snow
    if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'; // Showers
    if (code >= 95) return 'fa-bolt'; // Thunderstorm
    return 'fa-cloud';
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border-4 border-pink-100 shadow-xl h-full flex flex-col items-center justify-between relative overflow-hidden group">
       
       {/* Decor: Pink Glow Background */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
       <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-100 rounded-full blur-3xl -ml-10 -mb-10 opacity-60"></div>

       {/* Header */}
       <div className="w-full flex justify-between items-center z-10 border-b border-pink-50 pb-2">
          <div className="flex items-center gap-2 text-pink-500">
             <i className="fas fa-satellite-dish animate-pulse"></i>
             <h3 className="font-display font-bold uppercase text-xs tracking-widest">{t.privateSpace.leisure.clock.title}</h3>
          </div>
          <span className="text-xs font-mono font-bold text-pink-300 uppercase">{t.privateSpace.leisure.clock.subtitle}</span>
       </div>

       {/* Main Display */}
       <div className="flex-1 flex flex-col items-center justify-center z-10 w-full gap-2">
          {/* Time */}
          <div className="text-6xl sm:text-7xl font-mono font-bold text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
             {formatTime(time)}
          </div>
          
          {/* Date */}
          <div className="text-pink-400 font-bold text-lg uppercase tracking-widest bg-pink-50 px-4 py-1 rounded-full">
             {formatDate(time)}
          </div>
       </div>

       {/* Weather Footer */}
       <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between z-10 border border-slate-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center text-xl shadow-lg shadow-pink-200">
                {loadingWeather ? (
                    <i className="fas fa-sync fa-spin text-xs"></i>
                ) : weather ? (
                    <i className={`fas ${getWeatherIcon(weather.code)}`}></i>
                ) : (
                    <i className="fas fa-exclamation-triangle text-xs"></i>
                )}
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shenzhen</span>
                <span className="text-lg font-bold text-slate-800">
                    {weather ? `${weather.temp}°C` : '--°C'}
                </span>
             </div>
          </div>
          
          <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
              <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 Live
              </div>
          </div>
       </div>
    </div>
  );
};

// --- THE FOUR PIRATE LORDS GAME ---
// A highly complex 7x6 sliding puzzle

const COLS = 7;
const ROWS = 6;
type Faction = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'NEUTRAL';
type UnitType = 'CAPTAIN' | 'SHIP' | 'TREASURE' | 'MAP' | 'CREW' | 'EMPTY';

interface GameBlock {
  id: string;
  faction: Faction;
  type: UnitType;
  x: number;
  y: number;
  isTarget: boolean; // True if this block belongs to a faction that needs to go home
}

const PirateLordsGame: React.FC = () => {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState<GameBlock[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showRules, setShowRules] = useState(true);

  // Initialize Board
  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = async () => {
    setIsInitializing(true);
    setIsWon(false);
    setMoves(0);

    // 1. Create Solved State (Logic from previous implementation)
    // Red (Top Left), Blue (Top Right), Green (Bottom Left), Yellow (Bottom Right)
    
    let tempBlocks: GameBlock[] = [];
    let idCounter = 0;

    const addBlock = (x: number, y: number, faction: Faction, type: UnitType, isTarget: boolean) => {
      tempBlocks.push({
        id: `b-${idCounter++}`,
        faction,
        type,
        x,
        y,
        isTarget
      });
    };

    const targets = [
       {f: 'RED', t: 'CAPTAIN'}, {f: 'RED', t: 'SHIP'}, {f: 'RED', t: 'TREASURE'}, {f: 'RED', t: 'MAP'},
       {f: 'BLUE', t: 'CAPTAIN'}, {f: 'BLUE', t: 'SHIP'}, {f: 'BLUE', t: 'TREASURE'}, {f: 'BLUE', t: 'MAP'},
       {f: 'GREEN', t: 'CAPTAIN'}, {f: 'GREEN', t: 'SHIP'}, {f: 'GREEN', t: 'TREASURE'}, {f: 'GREEN', t: 'MAP'},
       {f: 'YELLOW', t: 'CAPTAIN'}, {f: 'YELLOW', t: 'SHIP'}, {f: 'YELLOW', t: 'TREASURE'}, {f: 'YELLOW', t: 'MAP'},
    ];

    const getZone = (x: number, y: number) => {
       if (x < 3 && y < 3) return 'RED';
       if (x > 3 && y < 3) return 'BLUE';
       if (x < 3 && y > 2) return 'GREEN';
       if (x > 3 && y > 2) return 'YELLOW';
       return 'NEUTRAL';
    };

    const redT = targets.filter(t => t.f === 'RED');
    const blueT = targets.filter(t => t.f === 'BLUE');
    const greenT = targets.filter(t => t.f === 'GREEN');
    const yellowT = targets.filter(t => t.f === 'YELLOW');

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
         if (x === 3 && (y === 2 || y === 3)) continue; // Empty slots at center

         const zone = getZone(x, y);
         let blockData = { faction: 'NEUTRAL' as Faction, type: 'CREW' as UnitType, isTarget: false };

         if (zone === 'RED' && redT.length > 0) {
             const t = redT.pop()!;
             blockData = { faction: 'RED', type: t.t as UnitType, isTarget: true };
         } else if (zone === 'BLUE' && blueT.length > 0) {
             const t = blueT.pop()!;
             blockData = { faction: 'BLUE', type: t.t as UnitType, isTarget: true };
         } else if (zone === 'GREEN' && greenT.length > 0) {
             const t = greenT.pop()!;
             blockData = { faction: 'GREEN', type: t.t as UnitType, isTarget: true };
         } else if (zone === 'YELLOW' && yellowT.length > 0) {
             const t = yellowT.pop()!;
             blockData = { faction: 'YELLOW', type: t.t as UnitType, isTarget: true };
         }

         addBlock(x, y, blockData.faction, blockData.type, blockData.isTarget);
      }
    }

    // 2. SHUFFLE
    let gridMap = new Map<string, GameBlock>();
    tempBlocks.forEach(b => gridMap.set(`${b.x},${b.y}`, b));

    let emptySpots = [{x: 3, y: 2}, {x: 3, y: 3}];
    let lastMoveBlockId = '';

    for (let i = 0; i < 2000; i++) {
        const empty = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        const neighbors = [
           {x: empty.x, y: empty.y - 1}, {x: empty.x, y: empty.y + 1},
           {x: empty.x - 1, y: empty.y}, {x: empty.x + 1, y: empty.y}
        ].filter(n => n.x >= 0 && n.x < COLS && n.y >= 0 && n.y < ROWS);

        const validNeighbors = neighbors.filter(n => gridMap.has(`${n.x},${n.y}`));
        if (validNeighbors.length > 0) {
            const targetPos = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            const blockToMove = gridMap.get(`${targetPos.x},${targetPos.y}`)!;
            if (blockToMove.id === lastMoveBlockId && Math.random() > 0.1) continue;
            gridMap.delete(`${targetPos.x},${targetPos.y}`);
            blockToMove.x = empty.x;
            blockToMove.y = empty.y;
            gridMap.set(`${empty.x},${empty.y}`, blockToMove);
            const emptyIdx = emptySpots.indexOf(empty);
            emptySpots[emptyIdx] = targetPos;
            lastMoveBlockId = blockToMove.id;
        }
    }

    setBlocks(Array.from(gridMap.values()));
    setIsInitializing(false);
  };

  const handleBlockClick = (block: GameBlock) => {
    if (isWon || isInitializing) return;
    const occupied = new Set(blocks.map(b => `${b.x},${b.y}`));
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    for (const [dx, dy] of dirs) {
        const targetX = block.x + dx;
        const targetY = block.y + dy;
        if (targetX >= 0 && targetX < COLS && targetY >= 0 && targetY < ROWS) {
            if (!occupied.has(`${targetX},${targetY}`)) {
                const newBlocks = blocks.map(b => 
                    b.id === block.id ? { ...b, x: targetX, y: targetY } : b
                );
                setBlocks(newBlocks);
                setMoves(m => m + 1);
                checkWinCondition(newBlocks);
                return;
            }
        }
    }
  };

  const checkWinCondition = (currentBlocks: GameBlock[]) => {
      const isRedComplete = currentBlocks.filter(b => b.faction === 'RED').every(b => b.x < 3 && b.y < 3);
      const isBlueComplete = currentBlocks.filter(b => b.faction === 'BLUE').every(b => b.x > 3 && b.y < 3);
      const isGreenComplete = currentBlocks.filter(b => b.faction === 'GREEN').every(b => b.x < 3 && b.y > 2);
      const isYellowComplete = currentBlocks.filter(b => b.faction === 'YELLOW').every(b => b.x > 3 && b.y > 2);

      if (isRedComplete && isBlueComplete && isGreenComplete && isYellowComplete) {
          setIsWon(true);
      }
  };

  const getIcon = (type: UnitType) => {
      switch(type) {
          case 'CAPTAIN': return 'fa-skull-crossbones';
          case 'SHIP': return 'fa-ship';
          case 'TREASURE': return 'fa-gem';
          case 'MAP': return 'fa-map-marked-alt';
          case 'CREW': return Math.random() > 0.5 ? 'fa-anchor' : 'fa-wine-bottle';
          default: return 'fa-circle';
      }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-[7/6] bg-[#1a1510] rounded-xl overflow-hidden shadow-2xl border-[6px] border-[#3f2e22] select-none">
         {/* UI Header */}
         <div className="absolute top-0 left-0 right-0 h-10 bg-[#2a1f18] border-b border-[#5e4533] flex items-center justify-between px-4 z-30">
            <div className="text-[#c2a281] font-display font-bold text-xs uppercase tracking-widest flex items-center gap-2">
               <i className="fas fa-compass fa-spin-slow"></i>
               {t.privateSpace.leisure.pirate.title}
            </div>
            <div className="flex gap-4 text-[10px] font-mono text-[#8b735b]">
               <span>{t.privateSpace.leisure.pirate.moves}: <span className="text-white">{moves}</span></span>
               <button onClick={initializeBoard} className="hover:text-amber-500 transition-colors"><i className="fas fa-redo"></i> {t.privateSpace.leisure.pirate.reset}</button>
            </div>
         </div>

         {/* WIN MODAL */}
         {isWon && (
             <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                 <i className="fas fa-trophy text-6xl text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"></i>
                 <h2 className="text-3xl text-white font-display font-bold tracking-widest mb-2">{t.privateSpace.leisure.pirate.victory}</h2>
                 <p className="text-[#c2a281] mb-6">{t.privateSpace.leisure.pirate.victoryDesc}</p>
                 <button onClick={initializeBoard} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase rounded shadow-lg transition-all">{t.privateSpace.leisure.pirate.playAgain}</button>
             </div>
         )}

         {/* Loading Overlay */}
         {isInitializing && (
             <div className="absolute inset-0 z-50 bg-[#1a1510] flex flex-col items-center justify-center">
                 <i className="fas fa-dharmachakra fa-spin text-4xl text-[#5e4533] mb-4"></i>
                 <p className="text-[#5e4533] font-mono text-xs uppercase tracking-widest">Shuffling Deck...</p>
             </div>
         )}

         {/* BOARD BACKGROUND (Territories) */}
         <div className="absolute inset-0 top-10 flex">
             <div className="w-[42.85%] h-full flex flex-col">
                <div className="h-1/2 bg-red-900/10 border-r border-b border-red-900/20 relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><i className="fas fa-volcano text-6xl text-red-500"></i></div>
                </div>
                <div className="h-1/2 bg-emerald-900/10 border-r border-t border-emerald-900/20 relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><i className="fas fa-biohazard text-6xl text-emerald-500"></i></div>
                </div>
             </div>
             <div className="w-[14.3%] h-full bg-[#120f0c] border-x border-[#3f2e22]/30 flex flex-col items-center justify-center opacity-30">
                <div className="h-full w-px bg-white/5"></div>
             </div>
             <div className="w-[42.85%] h-full flex flex-col">
                <div className="h-1/2 bg-cyan-900/10 border-l border-b border-cyan-900/20 relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><i className="fas fa-icicles text-6xl text-cyan-500"></i></div>
                </div>
                <div className="h-1/2 bg-amber-900/10 border-l border-t border-amber-900/20 relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><i className="fas fa-sun text-6xl text-amber-500"></i></div>
                </div>
             </div>
         </div>

         {/* BLOCKS LAYER */}
         <div className="absolute inset-0 top-10">
            {blocks.map(block => {
               const isNeutral = block.faction === 'NEUTRAL';
               let colorClass = '';
               let borderClass = '';
               let glowClass = '';

               switch(block.faction) {
                  case 'RED': colorClass = 'bg-[#450a0a] text-red-400'; borderClass = 'border-red-600'; glowClass = 'shadow-[0_0_10px_rgba(220,38,38,0.3)]'; break;
                  case 'BLUE': colorClass = 'bg-[#082f49] text-cyan-400'; borderClass = 'border-cyan-600'; glowClass = 'shadow-[0_0_10px_rgba(8,145,178,0.3)]'; break;
                  case 'GREEN': colorClass = 'bg-[#052e16] text-emerald-400'; borderClass = 'border-emerald-600'; glowClass = 'shadow-[0_0_10px_rgba(5,150,105,0.3)]'; break;
                  case 'YELLOW': colorClass = 'bg-[#451a03] text-amber-400'; borderClass = 'border-amber-600'; glowClass = 'shadow-[0_0_10px_rgba(217,119,6,0.3)]'; break;
                  default: colorClass = 'bg-[#292524] text-[#57534e]'; borderClass = 'border-[#44403c]';
               }

               return (
                 <div
                    key={block.id}
                    onClick={() => handleBlockClick(block)}
                    className={`absolute transition-all duration-200 ease-in-out cursor-pointer p-0.5 z-10`}
                    style={{
                       width: `${100/COLS}%`,
                       height: `${100/ROWS}%`,
                       left: `${(block.x * 100) / COLS}%`,
                       top: `${(block.y * 100) / ROWS}%`,
                    }}
                 >
                    <div className={`w-full h-full border-2 rounded-lg flex items-center justify-center relative overflow-hidden ${colorClass} ${borderClass} ${!isNeutral ? glowClass : 'opacity-90'}`}>
                       {isNeutral && <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>}
                       <i className={`fas ${getIcon(block.type)} text-xl relative z-10`}></i>
                       {!isNeutral && (
                          <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${block.faction === 'RED' ? 'bg-red-500' : block.faction === 'BLUE' ? 'bg-cyan-500' : block.faction === 'GREEN' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                       )}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>

      {/* Rules Section - Always visible below game */}
      <div className="bg-[#2a1f18] rounded-xl p-4 border border-[#5e4533] shadow-lg">
         <button 
           onClick={() => setShowRules(!showRules)}
           className="w-full flex justify-between items-center text-[#c2a281] font-bold text-xs uppercase tracking-widest hover:text-white"
         >
           <span><i className="fas fa-scroll mr-2"></i> {t.privateSpace.leisure.pirate.rulesTitle}</span>
           <i className={`fas ${showRules ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
         </button>
         
         {showRules && (
           <ul className="mt-4 space-y-2 text-[11px] text-[#8b735b] font-mono leading-relaxed list-disc list-inside">
             {t.privateSpace.leisure.pirate.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
             ))}
           </ul>
         )}
      </div>
    </div>
  );
};

export const LeisureSpace: React.FC = () => {
  const { t } = useTranslation();
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Split Pane States
  const [leftWidth, setLeftWidth] = useState(60); // Percentage for Mahjong
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isXl, setIsXl] = useState(false);
  
  // Audio Player Logic
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
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // Screen Size Detection
  useEffect(() => {
    const checkSize = () => setIsXl(window.innerWidth >= 1280);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Resizing Logic
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let newPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Clamp between 30% and 70%
      newPercent = Math.max(30, Math.min(70, newPercent));
      setLeftWidth(newPercent);
    };

    const handleUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col xl:flex-row gap-6 xl:gap-0 h-full lg:overflow-hidden min-h-[600px] overflow-y-auto ${isDragging ? 'select-none cursor-col-resize' : ''}`}
    >
      
      {/* LEFT COLUMN: Mahjong Soul Iframe */}
      <div 
         className="h-[600px] xl:h-full bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-700 shadow-2xl relative order-1 shrink-0"
         style={{ width: isXl ? `${leftWidth}%` : '100%' }}
      >
         {/* Overlay to catch mouse events during drag */}
         {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}

         <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            {t.privateSpace.leisure.mahjong}
         </div>
         <iframe 
           src="https://game.maj-soul.com/" 
           className="w-full h-full border-0"
           allowFullScreen
           title="Mahjong Soul"
         />
      </div>

      {/* RESIZER HANDLE (Desktop Only) */}
      <div 
         className="hidden xl:flex w-6 bg-transparent hover:bg-slate-800/50 cursor-col-resize items-center justify-center z-20 order-2 shrink-0 transition-colors group -ml-3 -mr-3 relative mx-2"
         onMouseDown={startDrag}
         style={{ width: '24px' }}
      >
         {/* Visible Line */}
         <div className="w-1.5 h-16 bg-slate-700 rounded-full group-hover:bg-amber-500 transition-colors shadow-lg"></div>
         
         {/* Hover Tooltip */}
         <div className="absolute bottom-1/2 translate-y-1/2 left-8 bg-slate-800 text-slate-200 text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none z-50 font-bold uppercase tracking-wider">
            <i className="fas fa-arrows-alt-h mr-1"></i> Drag to Resize
         </div>
      </div>

      {/* RIGHT COLUMN: Scrollable Tools */}
      <div 
        className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar xl:pl-2 pb-20 order-3 flex-1 min-w-0"
      >
         {/* Top Row: Compact Music & Clock */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Compact Music Player */}
            <div className="bg-white/80 rounded-[2rem] p-5 border border-white shadow-lg backdrop-blur-md flex flex-col">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                     <i className={`fas fa-compact-disc ${isPlaying ? 'animate-spin-slow' : ''}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-slate-800 text-sm truncate">{t.privateSpace.leisure.musicTitle}</h3>
                     <p className="text-[10px] text-slate-500 uppercase">{isPlaying ? t.privateSpace.leisure.nowPlaying : t.privateSpace.leisure.stopped}</p>
                  </div>
               </div>

               <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
               
               <div className="flex gap-2 mb-4">
                 <input 
                   type="text" 
                   value={audioUrl}
                   onChange={(e) => setAudioUrl(e.target.value)}
                   placeholder="MP3 URL..."
                   className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                 />
                 <button onClick={() => playUrl(audioUrl)} className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors flex items-center justify-center">
                   <i className="fas fa-play text-xs"></i>
                 </button>
               </div>

               <div className="bg-slate-900 rounded-xl p-3 text-white flex justify-between items-center shadow-inner mt-auto">
                  <button className="text-slate-400 hover:text-white"><i className="fas fa-backward"></i></button>
                  <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play pl-0.5'} text-xs`}></i>
                  </button>
                  <button className="text-slate-400 hover:text-white"><i className="fas fa-forward"></i></button>
               </div>

               <div className="mt-4 flex-1 overflow-y-auto max-h-32 custom-scrollbar">
                  {DEMO_SONGS.map(song => (
                    <div key={song.id} onClick={() => playUrl(song.url)} className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer text-xs group">
                       <i className="fas fa-music text-slate-300 group-hover:text-indigo-400"></i>
                       <span className="truncate text-slate-600 group-hover:text-indigo-700">{song.title}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Digital Clock */}
            <div className="h-80">
               <DigitalClock />
            </div>
         </div>

         {/* Bottom: Full Width Pirate Lords */}
         <div className="w-full">
            <PirateLordsGame />
         </div>

      </div>
    </div>
  );
};