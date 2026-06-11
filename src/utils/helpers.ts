import { Player, PositionCode, TeamData, FormationSlot, FormationType } from "@/types";
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
        name: key.split('-').slice(0, -1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        continent,
        players: data[key].map((p: any) => ({
          name: p[0], overall: p[1], positions: p[2], nationality: p[3], 
          teamName: key.split('-').slice(0, -1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), teamKey: key
        }))
      });
    });
  };
  process(americans, "american"); process(europeans, "european");
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

// LÓGICA DE ENTROSAMENTO (CHEMISTRY)
export function getLinkChemistry(p1?: Player, p2?: Player): number {
  if (!p1 || !p2) return 0;
  
  const exactTeam = p1.teamKey === p2.teamKey;
  const baseTeam1 = p1.teamKey.split('-').slice(0, -1).join('-');
  const baseTeam2 = p2.teamKey.split('-').slice(0, -1).join('-');
  const sameBaseTeam = baseTeam1 === baseTeam2;
  const year1 = p1.teamKey.split('-').pop();
  const year2 = p2.teamKey.split('-').pop();
  const sameYear = year1 === year2;
  const sameCountry = p1.nationality === p2.nationality;

  if (exactTeam && sameCountry) return 100; // Verde: Mesma carta exata e mesmo país
  if (exactTeam && !sameCountry) return 75; // Amarelo: Mesmo time exato, países diferentes
  if (!sameBaseTeam && sameCountry && !sameYear) return 30; // Vermelho: Times diferentes, anos dif, mesmo país
  if (sameBaseTeam && !sameYear && !sameCountry) return 10; // Laranja: Mesmo time, anos diferentes, países dif
  if (sameCountry) return 50; // Azul: Catch-all para mesmo país

  return 0; // Vazio: Zero ligações
}

export function getLinkColor(chem: number): string {
  if (chem === 100) return "#22c55e"; 
  if (chem === 75) return "#eab308"; 
  if (chem === 50) return "#3b82f6"; 
  if (chem === 30) return "#ef4444"; 
  if (chem === 10) return "#f97316"; 
  return "rgba(255, 255, 255, 0.2)"; 
}

export function calculateTeamChemistry(slots: FormationSlot[], formation: FormationType | null): number {
  if (!formation) return 0;
  const links = FORMATION_LINKS[formation];
  if (!links) return 0;
  
  let total = 0;
  links.forEach(([id1, id2]) => {
    const p1 = slots.find(s => s.id === id1)?.player;
    const p2 = slots.find(s => s.id === id2)?.player;
    total += getLinkChemistry(p1, p2);
  });
  
  return Math.min(Math.floor(total / 11), 100);
}