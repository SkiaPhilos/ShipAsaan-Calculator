// Jump N Jump International Tariff with dual weight columns (From & To), 58 destination columns & zones, and EVERY weight slab intact without skips!

// Base column headers
const SUPER_HEADER = `,,ZONE-2,ZONE-3,ZONE-4,ZONE-5,ZONE-6,ZONE-7,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
const MAIN_HEADER = `WEIGHT,ZONE->,"US,PR",CA,AU,NL,DE,GB,BE,FR,CH,AT,IT,SE,ES,NO,DK,"AF,BD,BT,GG,JE,LI,MC,SM,FI,GI,IQ,,JO,LB",MX,"CZ,EE,HU,ID,RS,LV,SK,SI,UA,AL,AM,AZ,BY,BA,BG,MO,HR,LT,MK,ME,RS","DZ,BN,BI,KH,MR,MN,MA,MM,NP,NG,RU,RU,RU,RW,DJ,ER,ER,KZ,KE,KG,LA,TZ,TN,UZ,VN","AO,BW,TD,KM,CG,CD,MG,MW,MU,YT,NA,RE,LS,SC,SZ,ZW","DM,DO,EC,SV,FJ,PF,GA,GM,GE,GD,GP,GU,GT,GN,GW,GY,HT,HN,IS,CI,JM,LR,SL,BL,KN,VI,BQ,VI,KN,LC,SX,SX,VI,VC,SR,PF,MP,TG,VG,TT,TC,VC,UY,VE,VG,VI,AS,AI,AG,AR,AW,BS,BB,AG,BJ,BM,BO,BQ,BR,VG,BF,CM,IC,CV,KY,CL,CO,CR,CI,CU,CW,ML,MQ,MS,KN,NC,NI,NE,MP,PA,PY,PE,MP,BQ,MP,WS,SN",IN,OM,SA,BH,KW,TR,EG,LU,IE,PT,HK,CN,PL,SG,TW,KR,MY,JP,PH,ZA,LK,KE,QA,DZ,GR,RU,TH,"CY,MT",IL,NZ,ET,GH,MD,MZ,TZ,UG,ZM,COLEND`;

// Base anchor rates at 0.5kg for all 58 columns
const BASE_500G_RATES = [
  7999.83, 8141.51, 8063.26, 5483.95, 4763.51, 4999.71, 5132.09, 4662.72, 4885.39, 5362.53,
  5132.09, 5483.95, 4713.36, 5599.37, 5362.53, 6683.25, 9379.42, 9984.11, 9747.98, 11622.70,
  10379.80, 7421.76, 5341.79, 6185.40, 7421.76, 7421.76, 5725.61, 5004.46, 6006.30, 4978.05,
  5132.09, 5026.19, 6841.26, 5727.17, 5425.49, 7686.15, 8251.32, 9002.03, 7742.67, 5471.03,
  8331.84, 6453.66, 8353.27, 11111.04, 19151.29, 5362.53, 7617.75, 7617.75, 18716.80, 19773.70,
  21327.49, 7962.01, 12306.10, 16534.51, 9946.06, 7962.01, 7962.01, 8958.86
];

// Additional rate per kg for base tiers (approximate progression)
const ADDL_KG_SLOPE = [
  3070.0, 3494.0, 3163.0, 2980.0, 2548.0, 2645.0, 2772.0, 2671.0, 2900.0, 3108.0,
  2937.0, 3206.0, 2724.0, 2872.0, 3108.0, 3635.0, 5133.0, 4833.0, 5059.0, 6598.0,
  5595.0, 4005.0, 2806.0, 3323.0, 4005.0, 4005.0, 2972.0, 2483.0, 3016.0, 2504.0,
  2470.0, 2432.0, 3486.0, 2878.0, 2771.0, 4192.0, 4566.0, 5018.0, 4235.0, 2772.0,
  4548.0, 3519.0, 4596.0, 6128.0, 10468.0, 3108.0, 4067.0, 4067.0, 10680.0, 11218.0,
  12130.0, 4429.0, 6870.0, 9279.0, 5556.0, 4429.0, 4429.0, 5008.0
];

// Per kg excess rates for 70.01-99kg
const PER_KG_70_99 = [
  3252.63, 3552.26, 3184.97, 3084.78, 2600.00, 2690.00, 2830.00, 2720.00, 2980.00, 3180.00,
  3010.00, 3280.00, 2780.00, 2930.00, 3180.00, 3700.00, 5240.00, 4930.00, 5160.00, 6730.00,
  5710.00, 4090.00, 2860.00, 3390.00, 4090.00, 4090.00, 3030.00, 2530.00, 3080.00, 2550.00,
  2520.00, 2480.00, 3560.00, 2940.00, 2830.00, 4280.00, 4660.00, 5120.00, 4320.00, 2830.00,
  4640.00, 3590.00, 4690.00, 6250.00, 10680.00, 3180.00, 4150.00, 4150.00, 10900.00, 11450.00,
  12380.00, 4520.00, 7010.00, 9470.00, 5670.00, 4520.00, 4520.00, 5110.00
];

// Per kg excess rates for 99.01-1000kg
const PER_KG_99_1000 = [
  3105.00, 3390.00, 3040.00, 2950.00, 2480.00, 2570.00, 2700.00, 2600.00, 2850.00, 3040.00,
  2870.00, 3130.00, 2650.00, 2800.00, 3040.00, 3530.00, 5000.00, 4710.00, 4930.00, 6430.00,
  5450.00, 3910.00, 2730.00, 3240.00, 3910.00, 3910.00, 2890.00, 2420.00, 2940.00, 2440.00,
  2410.00, 2370.00, 3400.00, 2810.00, 2700.00, 4090.00, 4450.00, 4890.00, 4130.00, 2700.00,
  4430.00, 3430.00, 4480.00, 5970.00, 10200.00, 3040.00, 3960.00, 3960.00, 10410.00, 10940.00,
  11830.00, 4320.00, 6700.00, 9050.00, 5420.00, 4320.00, 4320.00, 4880.00
];

function formatRow(wFrom: number, wTo: number, rates: number[]): string {
  const formattedRates = rates.map((r) => r.toFixed(2));
  return `${wFrom.toFixed(2)},${wTo.toFixed(2)},${formattedRates.join(",")}`;
}

function buildAllCsvRows(): string[] {
  const rows: string[] = [];

  // 1. 0.5kg increments from 0.01 up to 10.0kg (20 rows total)
  let prevTo = 0;
  for (let w = 0.5; w <= 10.01; w += 0.5) {
    const wFrom = prevTo > 0 ? Number((prevTo + 0.01).toFixed(2)) : 0.01;
    const wTo = Number(w.toFixed(2));
    prevTo = wTo;

    const rowRates = BASE_500G_RATES.map((base, idx) => {
      const slope = ADDL_KG_SLOPE[idx];
      // Formula: base + (weight - 0.5) * slope
      const rate = base + Math.max(0, wTo - 0.5) * slope;
      return Number(rate.toFixed(2));
    });

    rows.push(formatRow(wFrom, wTo, rowRates));
  }

  // 2. 1.0kg increments from 10.01 up to 70.0kg (60 rows total)
  for (let w = 11.0; w <= 70.01; w += 1.0) {
    const wFrom = Number((prevTo + 0.01).toFixed(2));
    const wTo = Number(w.toFixed(2));
    prevTo = wTo;

    const rowRates = BASE_500G_RATES.map((base, idx) => {
      const slope = ADDL_KG_SLOPE[idx];
      const rate = base + Math.max(0, wTo - 0.5) * slope;
      return Number(rate.toFixed(2));
    });

    rows.push(formatRow(wFrom, wTo, rowRates));
  }

  // 3. Heavy per-kg excess tiers (2 rows)
  // 70.01 - 99.00 kg
  rows.push(formatRow(70.01, 99.00, PER_KG_70_99));

  // 99.01 - 1000.00 kg
  rows.push(formatRow(99.01, 1000.00, PER_KG_99_1000));

  return rows;
}

export const SAMPLE_JUMP_N_JUMP_CSV = [
  SUPER_HEADER,
  MAIN_HEADER,
  ...buildAllCsvRows(),
].join("\n");
