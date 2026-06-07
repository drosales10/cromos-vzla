export const SECTIONS_RAW = [
  { id:"FWC",  name:"FIFA World Cup",   flag:"🏆", color:"#FFD700", count:20, start:0, special:true },
  { id:"MEX",  name:"México",           flag:"🇲🇽", color:"#006847", count:20 },
  { id:"RSA",  name:"Sudáfrica",        flag:"🇿🇦", color:"#007A4D", count:20 },
  { id:"KOR",  name:"República de Corea", flag:"🇰🇷", color:"#CD2E3A", count:20 },
  { id:"CZE",  name:"Chequia",          flag:"🇨🇿", color:"#D7141A", count:20 },
  { id:"CAN",  name:"Canadá",           flag:"🇨🇦", color:"#FF0000", count:20 },
  { id:"BIH",  name:"Bosnia y Herzegovina", flag:"🇧🇦", color:"#002395", count:20 },
  { id:"QAT",  name:"Qatar",            flag:"🇶🇦", color:"#8D153A", count:20 },
  { id:"SUI",  name:"Suiza",            flag:"🇨🇭", color:"#FF0000", count:20 },
  { id:"BRA",  name:"Brasil",           flag:"🇧🇷", color:"#009C3B", count:20 },
  { id:"MAR",  name:"Marruecos",        flag:"🇲🇦", color:"#C1272D", count:20 },
  { id:"HAI",  name:"Haití",            flag:"🇭🇹", color:"#00209F", count:20 },
  { id:"SCO",  name:"Escocia",          flag:"🏴", color:"#003DA5", count:20 },
  { id:"USA",  name:"EE. UU.",          flag:"🇺🇸", color:"#3C3B6E", count:20 },
  { id:"PAR",  name:"Paraguay",         flag:"🇵🇾", color:"#D52B1E", count:20 },
  { id:"AUS",  name:"Australia",        flag:"🇦🇺", color:"#00843D", count:20 },
  { id:"TUR",  name:"Turquía",          flag:"🇹🇷", color:"#E30A17", count:20 },
  { id:"GER",  name:"Alemania",         flag:"🇩🇪", color:"#555555", count:20 },
  { id:"CUW",  name:"Curazao",          flag:"🇨🇼", color:"#003DA5", count:20 },
  { id:"CIV",  name:"Costa de Marfil",  flag:"🇨🇮", color:"#F77F00", count:20 },
  { id:"ECU",  name:"Ecuador",          flag:"🇪🇨", color:"#FFD100", count:20 },
  { id:"NED",  name:"Países Bajos",     flag:"🇳🇱", color:"#FF6600", count:20 },
  { id:"JPN",  name:"Japón",            flag:"🇯🇵", color:"#BC002D", count:20 },
  { id:"SWE",  name:"Suecia",           flag:"🇸🇪", color:"#006AA7", count:20 },
  { id:"TUN",  name:"Túnez",            flag:"🇹🇳", color:"#E70013", count:20 },
  { id:"BEL",  name:"Bélgica",          flag:"🇧🇪", color:"#EF3340", count:20 },
  { id:"EGY",  name:"Egipto",           flag:"🇪🇬", color:"#CE1126", count:20 },
  { id:"IRN",  name:"RI de Irán",       flag:"🇮🇷", color:"#239F40", count:20 },
  { id:"NZL",  name:"Nueva Zelanda",    flag:"🇳🇿", color:"#00247D", count:20 },
  { id:"ESP",  name:"España",           flag:"🇪🇸", color:"#AA151B", count:20 },
  { id:"CPV",  name:"Islas de Cabo Verde", flag:"🇨🇻", color:"#003893", count:20 },
  { id:"KSA",  name:"Arabia Saudí",     flag:"🇸🇦", color:"#006C35", count:20 },
  { id:"URU",  name:"Uruguay",          flag:"🇺🇾", color:"#5EB6E4", count:20 },
  { id:"FRA",  name:"Francia",          flag:"🇫🇷", color:"#002395", count:20 },
  { id:"SEN",  name:"Senegal",          flag:"🇸🇳", color:"#00853F", count:20 },
  { id:"IRQ",  name:"Irak",             flag:"🇮🇶", color:"#007A3D", count:20 },
  { id:"NOR",  name:"Noruega",          flag:"🇳🇴", color:"#EF2B2D", count:20 },
  { id:"ARG",  name:"Argentina",        flag:"🇦🇷", color:"#74ACDF", count:20 },
  { id:"ALG",  name:"Argelia",          flag:"🇩🇿", color:"#006233", count:20 },
  { id:"AUT",  name:"Austria",          flag:"🇦🇹", color:"#ED2939", count:20 },
  { id:"JOR",  name:"Jordania",         flag:"🇯🇴", color:"#007A3D", count:20 },
  { id:"POR",  name:"Portugal",         flag:"🇵🇹", color:"#006600", count:20 },
  { id:"COD",  name:"RD Congo",         flag:"🇨🇩", color:"#007FFF", count:20 },
  { id:"UZB",  name:"Uzbekistán",       flag:"🇺🇿", color:"#1EB53A", count:20 },
  { id:"COL",  name:"Colombia",         flag:"🇨🇴", color:"#FCD116", count:20 },
  { id:"ENG",  name:"Inglaterra",       flag:"🏴", color:"#CF142B", count:20 },
  { id:"CRO",  name:"Croacia",          flag:"🇭🇷", color:"#FF0000", count:20 },
  { id:"GHA",  name:"Ghana",            flag:"🇬🇭", color:"#006B3F", count:20 },
  { id:"PAN",  name:"Panamá",           flag:"🇵🇦", color:"#DA121A", count:20 },
  { id:"CC",   name:"Coca-Cola",        flag:"🥤", color:"#F40009", count:14, special:true },
];

export const SECTIONS = [
  ...SECTIONS_RAW.filter(s=>s.id==="FWC"),
  ...SECTIONS_RAW.filter(s=>!s.special).sort((a,b)=>a.name.localeCompare(b.name,"es")),
  ...SECTIONS_RAW.filter(s=>s.special&&s.id!=="FWC"),
];

export function buildAllCromos() {
  const all = [];
  SECTIONS.forEach(s => {
    const start = s.start ?? 1;
    for (let i = start; i < start + s.count; i++) {
      const num = s.start === 0 ? String(i).padStart(2,"0") : i;
      all.push({ id:`${s.id}${num}`, section:s.id, num: String(num) });
    }
  });
  return all;
}

export const ALL_CROMOS = buildAllCromos();
export const TOTAL_CROMOS = ALL_CROMOS.length;
