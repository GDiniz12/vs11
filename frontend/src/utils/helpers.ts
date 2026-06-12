import { Player, PositionCode, TeamData, FormationSlot, FormationType, Manager } from "@/types";
import { FORMATION_LINKS } from "./formations";

export function getAvailablePositions(slots: FormationSlot[], positions: PositionCode[]): number[] {
  return slots.filter(s => positions.includes(s.position) && !s.player).map(s => s.id);
}

export function getAllTeams(americans: any, europeans: any): TeamData[] {
  const teams: TeamData[] = [];
  const process = (data: any, continent: "american"|"european") => {
    Object.keys(data).forEach(key => {
      teams.push({
        key,
        name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        continent,
        players: data[key].map((p: any) => ({
          name: p[0], 
          overall: p[1], 
          positions: p[2], 
          nationality: p[3], 
          teamName: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
          teamKey: key
        }))
      });
    });
  };
  process(americans, "american"); 
  process(europeans, "european");
  return teams;
}

export function getRandomTeam(americans: any, europeans: any): TeamData {
  const all = getAllTeams(americans, europeans);
  return all[Math.floor(Math.random() * all.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getCountryEmoji(country: string): string {
  const map: Record<string, string> = {
    "Brasil": "🇧🇷", "Portugal": "🇵🇹", "Argentina": "🇦🇷", "Espanha": "🇪🇸",
    "Alemanha": "🇩🇪", "França": "🇫🇷", "Itália": "🇮🇹", "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Países Baixos": "🇳🇱", "Hungria": "🇭🇺", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Áustria": "🇦🇹", "Uruguai": "🇺🇾"
  };
  return map[country] || country;
}

// LÓGICA DE ENTROSAMENTO (CHEMISTRY)
export function getLinkChemistry(p1?: Player, p2?: Player): number {
  if (!p1 || !p2) return 0; 
  
  const exactTeam = p1.teamKey === p2.teamKey;
  const baseTeam1 = p1.teamKey.split('-').slice(0, -1).join('-');
  const baseTeam2 = p2.teamKey.split('-').slice(0, -1).join('-');
  const sameBaseTeam = baseTeam1 === baseTeam2;
  const sameCountry = p1.nationality === p2.nationality;

  if (exactTeam && sameCountry) return 100;
  if (exactTeam && !sameCountry) return 90;
  if (sameBaseTeam && sameCountry) return 85;
  if (sameCountry) return 75;
  if (sameBaseTeam) return 65;

  return 40; 
}

export function getLinkColor(chem: number): string {
  if (chem >= 100) return "#22c55e"; // Verde
  if (chem >= 90) return "#eab308";  // Amarelo
  if (chem >= 85) return "#f97316";  // Laranja
  if (chem >= 75) return "#3b82f6";  // Azul
  if (chem >= 65) return "#ef4444";  // Vermelho
  if (chem > 0) return "rgba(255, 255, 255, 0.4)"; // Branco
  return "rgba(255, 255, 255, 0.1)"; 
}

export function calculateTeamChemistry(slots: FormationSlot[], formation: FormationType | null, manager?: Manager | null): number {
  if (!formation) return 0;
  const links = FORMATION_LINKS[formation];
  if (!links || links.length === 0) return 0;
  
  let total = 0;
  links.forEach(([id1, id2]) => {
    const p1 = slots.find(s => s.id === id1)?.player;
    const p2 = slots.find(s => s.id === id2)?.player;
    total += getLinkChemistry(p1, p2);
  });

  // BÔNUS DO TÉCNICO
  let managerBonus = 0;
  if (manager) {
    const managerEmoji = getCountryEmoji(manager.nacionalidade);
    const baseTeamManager = manager.clubeAno.split('-').slice(0, -1).join('-');
    slots.forEach(s => {
      if (s.player) {
        const baseTeamPlayer = s.player.teamKey.split('-').slice(0, -1).join('-');
        
        if (s.player.teamKey === manager.clubeAno) {
          managerBonus += 150; // Pontuação gigante por ser do time EXATO do treinador
        } else if (baseTeamPlayer === baseTeamManager) {
          managerBonus += 80; // Treinou o mesmo clube mas em ano diferente
        } else if (s.player.nationality === managerEmoji) {
          managerBonus += 50; // Mesma nacionalidade do treinador
        }
      }
    });
  }
  
  return Math.min(Math.floor((total + managerBonus) / links.length), 100);
}