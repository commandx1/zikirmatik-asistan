export default function PremiumBg1() {
  return (
    <svg
      width='100%'
      viewBox='0 0 710 1210'
      role='img'
      xmlns='http://www.w3.org/2000/svg'
      style={{ maxWidth: 710, display: "block", marginInline: "auto" }}
    >
      <title>Premium Zikirmatik Arka Plan - Mor ve Gümüş</title>
      <desc>Mor ve gümüş renk paleti ile islami geometrik motifler içeren premium arka plan tasarımı</desc>
      <defs>
        <radialGradient id='bgGrad' cx='50%' cy='40%' r='70%'>
          <stop offset='0%' stop-color='#2D1B4E'></stop>
          <stop offset='60%' stop-color='#1A0E30'></stop>
          <stop offset='100%' stop-color='#0D0818'></stop>
        </radialGradient>
        <radialGradient id='glowCenter' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#9B6DFF' stop-opacity='0.3'></stop>
          <stop offset='100%' stop-color='#9B6DFF' stop-opacity='0'></stop>
        </radialGradient>
        <radialGradient id='glowTop' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#C0A0FF' stop-opacity='0.2'></stop>
          <stop offset='100%' stop-color='#C0A0FF' stop-opacity='0'></stop>
        </radialGradient>
        <linearGradient id='silverLine' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stop-color='#888' stop-opacity='0'></stop>
          <stop offset='30%' stop-color='#D0C0FF' stop-opacity='0.8'></stop>
          <stop offset='70%' stop-color='#E8DEFF' stop-opacity='0.9'></stop>
          <stop offset='100%' stop-color='#888' stop-opacity='0'></stop>
        </linearGradient>
        <linearGradient id='silverLineV' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stop-color='#888' stop-opacity='0'></stop>
          <stop offset='30%' stop-color='#D0C0FF' stop-opacity='0.6'></stop>
          <stop offset='70%' stop-color='#E8DEFF' stop-opacity='0.7'></stop>
          <stop offset='100%' stop-color='#888' stop-opacity='0'></stop>
        </linearGradient>
        <linearGradient id='goldAccent' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#C8B0FF'></stop>
          <stop offset='50%' stop-color='#F0E8FF'></stop>
          <stop offset='100%' stop-color='#A080E0'></stop>
        </linearGradient>
        <filter id='softGlow'>
          <feGaussianBlur stdDeviation='3' result='blur'></feGaussianBlur>
          <feMerge>
            <feMergeNode in='blur'></feMergeNode>
            <feMergeNode in='SourceGraphic'></feMergeNode>
          </feMerge>
        </filter>
      </defs>

      <rect width='680' height='1200' fill='url(#bgGrad)'></rect>

      <ellipse cx='340' cy='480' rx='280' ry='220' fill='url(#glowCenter)'></ellipse>
      <ellipse cx='340' cy='200' rx='200' ry='150' fill='url(#glowTop)'></ellipse>
      <ellipse cx='140' cy='900' rx='160' ry='120' fill='#6B3FC0' opacity='0.12'></ellipse>
      <ellipse cx='560' cy='750' rx='140' ry='110' fill='#8B5FE0' opacity='0.1'></ellipse>

      <circle cx='80' cy='80' r='1.5' fill='#D0C0FF' opacity='0.9'></circle>
      <circle cx='200' cy='50' r='1' fill='#E8DEFF' opacity='0.7'></circle>
      <circle cx='350' cy='30' r='2' fill='#C0A0FF' opacity='0.8'></circle>
      <circle cx='480' cy='70' r='1' fill='#D0C0FF' opacity='0.6'></circle>
      <circle cx='600' cy='40' r='1.5' fill='#E8DEFF' opacity='0.9'></circle>
      <circle cx='640' cy='120' r='1' fill='#C0A0FF' opacity='0.7'></circle>
      <circle cx='60' cy='200' r='1.5' fill='#D0C0FF' opacity='0.5'></circle>
      <circle cx='620' cy='280' r='1' fill='#E8DEFF' opacity='0.8'></circle>
      <circle cx='30' cy='400' r='2' fill='#C0A0FF' opacity='0.6'></circle>
      <circle cx='660' cy='500' r='1.5' fill='#D0C0FF' opacity='0.7'></circle>
      <circle cx='50' cy='650' r='1' fill='#E8DEFF' opacity='0.5'></circle>
      <circle cx='650' cy='700' r='2' fill='#C0A0FF' opacity='0.6'></circle>
      <circle cx='100' cy='850' r='1' fill='#D0C0FF' opacity='0.8'></circle>
      <circle cx='580' cy='950' r='1.5' fill='#E8DEFF' opacity='0.5'></circle>
      <circle cx='150' cy='1100' r='1' fill='#C0A0FF' opacity='0.7'></circle>
      <circle cx='520' cy='1150' r='1.5' fill='#D0C0FF' opacity='0.6'></circle>
      <circle cx='260' cy='120' r='1' fill='#E8DEFF' opacity='0.6'></circle>
      <circle cx='420' cy='160' r='1.5' fill='#C0A0FF' opacity='0.5'></circle>

      <rect x='30' y='30' width='620' height='2' fill='url(#silverLine)' opacity='0.6'></rect>
      <rect x='30' y='38' width='620' height='1' fill='url(#silverLine)' opacity='0.3'></rect>

      <rect x='30' y='1168' width='620' height='2' fill='url(#silverLine)' opacity='0.6'></rect>
      <rect x='30' y='1161' width='620' height='1' fill='url(#silverLine)' opacity='0.3'></rect>

      <rect x='30' y='30' width='2' height='1140' fill='url(#silverLineV)' opacity='0.6'></rect>

      <rect x='648' y='30' width='2' height='1140' fill='url(#silverLineV)' opacity='0.6'></rect>

      <g opacity='0.7'>
        <rect x='28' y='28' width='14' height='2' fill='#C0A0FF'></rect>
        <rect x='28' y='28' width='2' height='14' fill='#C0A0FF'></rect>
        <rect x='36' y='36' width='6' height='1' fill='#C0A0FF' opacity='0.5'></rect>
        <rect x='36' y='36' width='1' height='6' fill='#C0A0FF' opacity='0.5'></rect>
      </g>

      <g opacity='0.7'>
        <rect x='638' y='28' width='14' height='2' fill='#C0A0FF'></rect>
        <rect x='650' y='28' width='2' height='14' fill='#C0A0FF'></rect>
        <rect x='638' y='36' width='6' height='1' fill='#C0A0FF' opacity='0.5'></rect>
        <rect x='643' y='36' width='1' height='6' fill='#C0A0FF' opacity='0.5'></rect>
      </g>

      <g opacity='0.7'>
        <rect x='28' y='1170' width='14' height='2' fill='#C0A0FF'></rect>
        <rect x='28' y='1158' width='2' height='14' fill='#C0A0FF'></rect>
        <rect x='36' y='1163' width='6' height='1' fill='#C0A0FF' opacity='0.5'></rect>
        <rect x='36' y='1158' width='1' height='6' fill='#C0A0FF' opacity='0.5'></rect>
      </g>

      <g opacity='0.7'>
        <rect x='638' y='1170' width='14' height='2' fill='#C0A0FF'></rect>
        <rect x='650' y='1158' width='2' height='14' fill='#C0A0FF'></rect>
        <rect x='638' y='1163' width='6' height='1' fill='#C0A0FF' opacity='0.5'></rect>
        <rect x='643' y='1158' width='1' height='6' fill='#C0A0FF' opacity='0.5'></rect>
      </g>

      <g transform='translate(340, 480)'>
        <circle cx='0' cy='0' r='170' fill='none' stroke='#7B4FC8' stroke-width='1' opacity='0.3'></circle>
        <circle cx='0' cy='0' r='165' fill='none' stroke='#9B6DFF' stroke-width='0.5' opacity='0.4'></circle>

        <circle
          cx='0'
          cy='0'
          r='148'
          fill='none'
          stroke='#C0A0FF'
          stroke-width='0.8'
          stroke-dasharray='4 8'
          opacity='0.5'
        ></circle>

        <polygon
          points='0,-140 99,-99 140,0 99,99 0,140 -99,99 -140,0 -99,-99'
          fill='none'
          stroke='#B090EE'
          stroke-width='1.2'
          opacity='0.5'
        ></polygon>

        <polygon
          points='0,-120 85,-85 120,0 85,85 0,120 -85,85 -120,0 -85,-85'
          fill='#1E0F38'
          stroke='#9B6DFF'
          stroke-width='1.5'
          opacity='0.9'
        ></polygon>

        <polygon
          points='0,-105 105,0 0,105 -105,0'
          fill='none'
          stroke='#C0A0FF'
          stroke-width='1'
          opacity='0.6'
        ></polygon>
        <polygon
          points='0,-82 82,0 0,82 -82,0'
          fill='#2A1245'
          stroke='#D0B0FF'
          stroke-width='1'
          opacity='0.8'
        ></polygon>

        <g opacity='0.85'>
          <polygon points='0,-118 18,-60 0,-40 -18,-60' fill='#9B6DFF' opacity='0.7'></polygon>
          <polygon points='118,0 60,18 40,0 60,-18' fill='#9B6DFF' opacity='0.7'></polygon>
          <polygon points='0,118 -18,60 0,40 18,60' fill='#9B6DFF' opacity='0.7'></polygon>
          <polygon points='-118,0 -60,-18 -40,0 -60,18' fill='#9B6DFF' opacity='0.7'></polygon>
          <polygon points='83,-83 36,-52 23,-23 52,-36' fill='#8B5FDF' opacity='0.6'></polygon>
          <polygon points='83,83 52,36 23,23 36,52' fill='#8B5FDF' opacity='0.6'></polygon>
          <polygon points='-83,83 -36,52 -23,23 -52,36' fill='#8B5FDF' opacity='0.6'></polygon>
          <polygon points='-83,-83 -52,-36 -23,-23 -36,-52' fill='#8B5FDF' opacity='0.6'></polygon>
        </g>

        <polygon
          points='0,-60 42,-42 60,0 42,42 0,60 -42,42 -60,0 -42,-42'
          fill='#3D1F6A'
          stroke='#E0D0FF'
          stroke-width='1.2'
          opacity='0.9'
        ></polygon>
        <polygon
          points='0,-44 44,0 0,44 -44,0'
          fill='#2D1255'
          stroke='#C8B0FF'
          stroke-width='1'
          opacity='0.8'
        ></polygon>

        <circle cx='0' cy='0' r='28' fill='#4B2880' stroke='#E8DEFF' stroke-width='1.5' opacity='0.95'></circle>
        <circle cx='0' cy='0' r='18' fill='#7B4FBF' stroke='#F0E8FF' stroke-width='1' opacity='0.9'></circle>
        <circle cx='0' cy='0' r='9' fill='#C0A0FF' opacity='0.8'></circle>
        <circle cx='0' cy='0' r='4' fill='#F0E8FF' opacity='0.95'></circle>
      </g>

      <rect x='80' y='300' width='520' height='1' fill='url(#silverLine)' opacity='0.4'></rect>

      <g transform='translate(340, 160)' opacity='0.8'>
        <path
          d='M-90,0 Q-90,-80 0,-90 Q90,-80 90,0 Z'
          fill='none'
          stroke='#C0A0FF'
          stroke-width='1.2'
          opacity='0.7'
        ></path>
        <path
          d='M-70,0 Q-70,-60 0,-68 Q70,-60 70,0 Z'
          fill='none'
          stroke='#A080D0'
          stroke-width='0.8'
          opacity='0.5'
        ></path>

        <circle cx='0' cy='-88' r='5' fill='#C0A0FF' opacity='0.8'></circle>
        <circle cx='0' cy='-88' r='2.5' fill='#F0E8FF' opacity='0.9'></circle>

        <circle cx='-90' cy='0' r='3' fill='#C0A0FF' opacity='0.7'></circle>
        <circle cx='90' cy='0' r='3' fill='#C0A0FF' opacity='0.7'></circle>

        <polygon
          points='0,-50 5,-42 14,-42 7,-36 10,-27 0,-32 -10,-27 -7,-36 -14,-42 -5,-42'
          fill='#D0B0FF'
          opacity='0.7'
        ></polygon>

        <rect x='-60' y='0' width='120' height='1' fill='#C0A0FF' opacity='0.5'></rect>
      </g>

      <g transform='translate(120, 240)' opacity='0.5'>
        <polygon
          points='0,-22 15,-15 22,0 15,15 0,22 -15,15 -22,0 -15,-15'
          fill='none'
          stroke='#A080D0'
          stroke-width='1'
        ></polygon>
        <polygon points='0,-16 16,0 0,16 -16,0' fill='none' stroke='#C0A0FF' stroke-width='0.8'></polygon>
        <circle cx='0' cy='0' r='4' fill='#9B6DFF' opacity='0.7'></circle>
      </g>

      <g transform='translate(560, 240)' opacity='0.5'>
        <polygon
          points='0,-22 15,-15 22,0 15,15 0,22 -15,15 -22,0 -15,-15'
          fill='none'
          stroke='#A080D0'
          stroke-width='1'
        ></polygon>
        <polygon points='0,-16 16,0 0,16 -16,0' fill='none' stroke='#C0A0FF' stroke-width='0.8'></polygon>
        <circle cx='0' cy='0' r='4' fill='#9B6DFF' opacity='0.7'></circle>
      </g>

      <g opacity='0.25'>
        <g transform='translate(100,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(200,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(300,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(400,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(500,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(600,750)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>

        <g transform='translate(150,820)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(250,820)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(350,820)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(450,820)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
        <g transform='translate(550,820)'>
          <polygon
            points='0,-18 13,-13 18,0 13,13 0,18 -13,13 -18,0 -13,-13'
            fill='none'
            stroke='#C0A0FF'
            stroke-width='0.8'
          ></polygon>
          <polygon points='0,-12 12,0 0,12 -12,0' fill='none' stroke='#D0B0FF' stroke-width='0.6'></polygon>
        </g>
      </g>

      <rect x='80' y='680' width='520' height='1' fill='url(#silverLine)' opacity='0.4'></rect>

      <g transform='translate(340, 900)' opacity='0.7'>
        <polygon
          points='0,-50 35,-35 50,0 35,35 0,50 -35,35 -50,0 -35,-35'
          fill='none'
          stroke='#B090EE'
          stroke-width='1.2'
        ></polygon>
        <polygon points='0,-36 36,0 0,36 -36,0' fill='none' stroke='#D0B0FF' stroke-width='1'></polygon>
        <circle cx='0' cy='0' r='14' fill='#3D1F6A' stroke='#E0D0FF' stroke-width='1'></circle>
        <circle cx='0' cy='0' r='7' fill='#9B6DFF' opacity='0.8'></circle>
        <circle cx='0' cy='0' r='3' fill='#F0E8FF' opacity='0.9'></circle>
      </g>

      <g transform='translate(80, 480)' opacity='0.4'>
        <polygon
          points='0,-35 25,-25 35,0 25,25 0,35 -25,25 -35,0 -25,-25'
          fill='none'
          stroke='#C0A0FF'
          stroke-width='1'
        ></polygon>
        <polygon points='0,-24 24,0 0,24 -24,0' fill='none' stroke='#D0B0FF' stroke-width='0.8'></polygon>
        <circle cx='0' cy='0' r='6' fill='#7B4FBF' opacity='0.7'></circle>
      </g>

      <g transform='translate(600, 480)' opacity='0.4'>
        <polygon
          points='0,-35 25,-25 35,0 25,25 0,35 -25,25 -35,0 -25,-25'
          fill='none'
          stroke='#C0A0FF'
          stroke-width='1'
        ></polygon>
        <polygon points='0,-24 24,0 0,24 -24,0' fill='none' stroke='#D0B0FF' stroke-width='0.8'></polygon>
        <circle cx='0' cy='0' r='6' fill='#7B4FBF' opacity='0.7'></circle>
      </g>

      <text
        x='340'
        y='1010'
        text-anchor='middle'
        font-family='serif'
        font-size='32'
        font-weight='300'
        letter-spacing='8'
        fill='url(#goldAccent)'
        opacity='0.95'
      >
        ZİKİRMATİK
      </text>
      <text
        x='340'
        y='1045'
        text-anchor='middle'
        font-family='serif'
        font-size='13'
        font-weight='300'
        letter-spacing='5'
        fill='#C0A0FF'
        opacity='0.75'
      >
        R E H B E R
      </text>

      <rect x='260' y='1062' width='160' height='1' fill='url(#silverLine)' opacity='0.6'></rect>
      <circle cx='340' cy='1062' r='2' fill='#D0B0FF' opacity='0.8'></circle>

      <text
        x='340'
        y='1090'
        text-anchor='middle'
        font-family='sans-serif'
        font-size='11'
        letter-spacing='4'
        fill='#A080D0'
        opacity='0.7'
      >
        ✦ P R E M I U M ✦
      </text>

      <g opacity='0.5'>
        <circle cx='280' cy='1115' r='2' fill='#C0A0FF'></circle>
        <circle cx='300' cy='1115' r='1.5' fill='#D0B0FF'></circle>
        <circle cx='320' cy='1115' r='1' fill='#E0D0FF'></circle>
        <circle cx='340' cy='1115' r='3' fill='#C0A0FF'></circle>
        <circle cx='360' cy='1115' r='1' fill='#E0D0FF'></circle>
        <circle cx='380' cy='1115' r='1.5' fill='#D0B0FF'></circle>
        <circle cx='400' cy='1115' r='2' fill='#C0A0FF'></circle>
      </g>
    </svg>
  )
}
