import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Txt } from './ui';

/** Smooth line chart with level labels on the left (designer's Wellbeing Trends). */
export function LineChart({ values, labels, levels, color, grid, text }: { values: (number | undefined)[]; labels: string[]; levels: string[]; color: string; grid: string; text: string }) {
  const [w, setW] = useState(300);
  const H = 110;
  const left = 46;
  const plotW = Math.max(10, w - left - 8);
  const max = levels.length - 1;
  const pts = values
    .map((v, i) => (v === undefined ? null : { x: left + (plotW * i) / Math.max(1, values.length - 1), y: 8 + (H - 16) * (1 - v / max) }))
    .filter(Boolean) as { x: number; y: number }[];
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) d = `M ${p.x} ${p.y}`;
    else {
      const p0 = pts[i - 1];
      const cx = (p0.x + p.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }
  });
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={{ height: H }}>
        <Svg width={w} height={H}>
          {levels.map((_, i) => {
            const y = 8 + ((H - 16) * i) / max;
            return <Line key={i} x1={left} x2={w - 4} y1={y} y2={y} stroke={grid} strokeWidth={1} />;
          })}
          {d ? <Path d={d} stroke={color} strokeWidth={2.5} fill="none" /> : null}
          {pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4.5} fill="#FFFFFF" stroke={color} strokeWidth={2} />
          ))}
        </Svg>
        {[...levels].reverse().map((l, i) => (
          <Txt key={l} style={{ position: 'absolute', left: 0, top: 8 + ((H - 16) * i) / max - 8, fontSize: 10.5 }} color={text}>
            {l}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginLeft: left - 14, marginTop: 4 }}>
        {labels.map((l, i) => (
          <Txt key={i} center color={text} style={{ flex: 1, fontSize: 10.5 }}>
            {l}
          </Txt>
        ))}
      </View>
    </View>
  );
}
