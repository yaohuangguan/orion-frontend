
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';

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
  isTarget: boolean; 
}

export const PirateLordsGame: React.FC = () => {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState<GameBlock[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = async () => {
    setIsInitializing(true);
    setIsWon(false);
    setMoves(0);

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
         if (x === 3 && (y === 2 || y === 3)) continue; 

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

         {isWon && (
             <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                 <i className="fas fa-trophy text-6xl text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"></i>
                 <h2 className="text-3xl text-white font-display font-bold tracking-widest mb-2">{t.privateSpace.leisure.pirate.victory}</h2>
                 <p className="text-[#c2a281] mb-6">{t.privateSpace.leisure.pirate.victoryDesc}</p>
                 <button onClick={initializeBoard} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase rounded shadow-lg transition-all">{t.privateSpace.leisure.pirate.playAgain}</button>
             </div>
         )}

         {isInitializing && (
             <div className="absolute inset-0 z-50 bg-[#1a1510] flex flex-col items-center justify-center">
                 <i className="fas fa-dharmachakra fa-spin text-4xl text-[#5e4533] mb-4"></i>
                 <p className="text-[#5e4533] font-mono text-xs uppercase tracking-widest">Shuffling Deck...</p>
             </div>
         )}

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
