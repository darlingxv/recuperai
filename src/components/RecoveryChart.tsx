// Grafico de area simples em SVG puro (sem biblioteca externa).
// Mostra recuperado vs em aberto ao longo da semana.

const recovered = [3200, 5100, 4800, 7200, 6500, 4100, 2800];
const open = [12000, 10800, 9500, 8100, 7200, 6800, 6200];
const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const W = 640;
const H = 150;
const PAD = 28;

function pointsFor(data: number[], max: number): string {
  const stepX = (W - PAD * 2) / (data.length - 1);
  return data
    .map((v, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - (v / max) * (H - PAD * 1.4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function areaFor(data: number[], max: number): string {
  const stepX = (W - PAD * 2) / (data.length - 1);
  const top = data
    .map((v, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - (v / max) * (H - PAD * 1.4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L ");
  return `M ${PAD},${H - PAD} L ${top} L ${W - PAD},${H - PAD} Z`;
}

export default function RecoveryChart() {
  const max = Math.max(...recovered, ...open) * 1.1;
  const stepX = (W - PAD * 2) / (labels.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Recuperacao semanal">
      <path d={areaFor(open, max)} fill="rgba(226,75,74,0.06)" />
      <polyline points={pointsFor(open, max)} fill="none" stroke="#e24b4a" strokeWidth="1.5" />
      <path d={areaFor(recovered, max)} fill="rgba(29,158,117,0.10)" />
      <polyline points={pointsFor(recovered, max)} fill="none" stroke="#1d9e75" strokeWidth="1.5" />
      {recovered.map((v, i) => {
        const x = PAD + i * stepX;
        const y = H - PAD - (v / max) * (H - PAD * 1.4);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#1d9e75" />;
      })}
      {labels.map((l, i) => {
        const x = PAD + i * stepX;
        return (
          <text key={l} x={x} y={H - 8} fontSize="10" fill="#6b7280" textAnchor="middle">
            {l}
          </text>
        );
      })}
    </svg>
  );
}
