import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Circular progress ring used on the 12-Step and Health screens. */
export function Ring({ value, size = 86, stroke = 6, color, track = '#E3E8EC', children }: { value: number; size?: number; stroke?: number; color: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - v)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
