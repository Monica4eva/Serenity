import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { View } from 'react-native';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useApp } from '../lib/useApp';
import { weekdayShort } from '../lib/dates';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreRing({ score, size = 150 }: { score: number | null; size?: number }) {
  const { theme, t } = useApp();
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const v = score ?? 0;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce) anim.setValue(v);
        else Animated.timing(anim, { toValue: v, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      });
  }, [v]);
  const color = v >= 70 ? '#2E9D5B' : v >= 40 ? '#F5A623' : '#D64545';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={score === null ? t('health.noScore') : t('health.scoreLabel', { v })} style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.border} strokeWidth={14} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={14}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={anim.interpolate({ inputRange: [0, 100], outputRange: [c, 0] })}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText x={size / 2} y={size / 2 + 12} fontSize={34} fontWeight="700" fill={theme.colors.heading} textAnchor="middle">
          {score === null ? '–' : `${v}%`}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Simple bar chart. Values may be undefined (no data). Labels are read by screen readers. */
export function Bars({ days, values, max, unit, color }: { days: Date[]; values: (number | undefined)[]; max: number; unit: string; color?: string }) {
  const { theme, t, state } = useApp();
  const lang = state.language;
  const H = 90;
  const summary = days.map((d, i) => `${weekdayShort(d, lang)} ${values[i] === undefined ? t('common.noData') : `${values[i]} ${unit}`}`).join(', ');
  return (
    <View accessible accessibilityLabel={summary} style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, height: H + 24 }}>
      {days.map((d, i) => {
        const v = values[i];
        const h = v === undefined ? 4 : Math.max(4, (Math.min(v, max) / max) * H);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Svg width="100%" height={H}>
              <Rect x="20%" y={H - h} width="60%" height={h} rx={5} fill={v === undefined ? theme.colors.border : color ?? theme.colors.primary} />
            </Svg>
            <SvgLabel text={weekdayShort(d, lang).slice(0, 3)} />
          </View>
        );
      })}
    </View>
  );
}

function SvgLabel({ text }: { text: string }) {
  const { theme } = useApp();
  return (
    <Svg width={24} height={16}>
      <SvgText x={12} y={12} fontSize={11} fill={theme.colors.body} textAnchor="middle">
        {text}
      </SvgText>
    </Svg>
  );
}
