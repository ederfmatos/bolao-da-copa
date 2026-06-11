// Mapping de nomes das seleções da API (inglês) para o seed (português)
export const teamNameMapping: Record<string, string> = {
  // Grupo A
  'Mexico': 'México',
  'South Africa': 'África do Sul',
  'Korea Republic': 'Coreia do Sul',
  'Czechia': 'Tchéquia',
  
  // Grupo B
  'Canada': 'Canadá',
  'Bosnia-H.': 'Bósnia e Herzegovina',
  'Qatar': 'Catar',
  'Switzerland': 'Suíça',
  
  // Grupo C
  'Brazil': 'Brasil',
  'Morocco': 'Marrocos',
  'Haiti': 'Haiti',
  'Scotland': 'Escócia',
  
  // Grupo D
  'USA': 'Estados Unidos',
  'Paraguay': 'Paraguai',
  'Uzbekistan': 'Uzbequistão',
  'Colombia': 'Colômbia',
  
  // Grupo E
  'Australia': 'Austrália',
  'Turkey': 'Turquia',
  'Ghana': 'Gana',
  'Panama': 'Panamá',
  
  // Grupo F
  'Germany': 'Alemanha',
  'Curaçao': 'Curaçao',
  'Netherlands': 'Países Baixos',
  'Japan': 'Japão',
  
  // Grupo G
  'Ivory Coast': 'Costa do Marfim',
  'Ecuador': 'Equador',
  'Sweden': 'Suécia',
  'Tunisia': 'Tunísia',
  
  // Grupo H
  'Spain': 'Espanha',
  'Cape Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arábia Saudita',
  'Uruguay': 'Uruguai',
  
  // Grupo I
  'Belgium': 'Bélgica',
  'Egypt': 'Egito',
  'Iran': 'Irã',
  'New Zealand': 'Nova Zelândia',
  
  // Grupo J
  'France': 'França',
  'Senegal': 'Senegal',
  'Iraq': 'Iraque',
  'Norway': 'Noruega',
  
  // Grupo K
  'Argentina': 'Argentina',
  'Algeria': 'Argélia',
  'Austria': 'Áustria',
  'Jordan': 'Jordânia',
  
  // Grupo L
  'Portugal': 'Portugal',
  'Congo DR': 'RD Congo',
  'England': 'Inglaterra',
  'Croatia': 'Croácia',
}

export function mapTeamName(apiName: string): string {
  return teamNameMapping[apiName] || apiName
}
