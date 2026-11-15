// Gentle motion (Section 3: "Motion: gentle. Respect the OS reduce-motion setting").
// Every animation here switches off when the phone's "Reduce motion" setting is on.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';
import { useApp } from '../lib/useApp';
import { Txt } from './ui';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Fades and slides content up into place. */
export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return v.setValue(1);
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '💚', '🧡', '✨', '🎉', '⭐', '💙'];

/**
 * The day-counter emoji. On a milestone day it bounces and sends out a burst of confetti
 * (tap to play it again). On other days a seedling sways gently.
 */
export function Celebrate({ milestone, label }: { milestone: boolean; label: string }) {
  const reduce = useReduceMotion();
  const bounce = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  const play = () => {
    if (reduce) return;
    bounce.setValue(0);
    burst.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(bounce, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(burst, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (reduce) return;
    if (milestone) {
      play();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [milestone, reduce]);

  const emojiStyle = milestone
    ? {
        transform: [
          { scale: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
          { rotate: bounce.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-14deg'] }) },
        ],
      }
    : { transform: [{ rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] }) }] };

  return (
    <Pressable onPress={milestone ? play : undefined} accessibilityRole={milestone ? 'button' : 'image'} accessibilityLabel={label} style={{ width: 56, height: 60, alignItems: 'center', justifyContent: 'center' }}>
      {milestone && !reduce
        ? CONFETTI.map((c, i) => {
            const angle = (i / CONFETTI.length) * Math.PI * 2;
            const dist = 46 + (i % 3) * 14;
            return (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: 16,
                  opacity: burst.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] }) },
                    { translateY: burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, Math.sin(angle) * dist - 10, Math.sin(angle) * dist + 18] }) },
                    { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 220}deg`] }) },
                  ],
                }}
              >
                {c}
              </Animated.Text>
            );
          })
        : null}
      <Animated.Text style={[{ fontSize: 44, lineHeight: 52 }, emojiStyle]}>{milestone ? '🎉' : '🌱'}</Animated.Text>
    </Pressable>
  );
}

/** A small "pop" when something becomes done (e.g. a Today's Focus tick). */
export function Pop({ active, children }: { active: boolean; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (active && !reduce) {
      v.setValue(0.4);
      Animated.spring(v, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
    }
  }, [active]);
  return <Animated.View style={{ transform: [{ scale: v }] }}>{children}</Animated.View>;
}

/**
 * Guided breathing circle. pattern = seconds for [in, hold, out, hold].
 * Box breathing: [4, 4, 4, 4]. Calming breath: [4, 4, 6, 0].
 */
/** Blue, as the breathing instructions say: in through the nose as it rises, out through the mouth as it goes down. */
const BREATH_BLUE = '#3D7FD9';

export function BreathingCircle({ pattern = [4, 4, 6, 0], size = 160, showGuide = true }: { pattern?: number[]; size?: number; showGuide?: boolean }) {
  const { t, theme } = useApp();
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(0.6)).current;
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(pattern[0]);
  const [breaths, setBreaths] = useState(0);
  const labels = [t('breathe.in'), t('breathe.hold'), t('breathe.out'), t('breathe.hold')];

  // Phase clock (runs even with reduced motion, so the words and count still guide the person).
  useEffect(() => {
    let p = 0;
    let left = pattern[0];
    setPhase(0);
    setCount(left);
    setBreaths(0);
    const id = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        const prevP = p;
        do {
          p = (p + 1) % 4;
        } while (pattern[p] === 0);
        // A full breath = in, then out. Count it when a new "in" starts after an "out".
        if (p === 0 && prevP !== 0) setBreaths((b) => b + 1);
        left = pattern[p];
        setPhase(p);
      }
      setCount(left);
    }, 1000);
    return () => clearInterval(id);
  }, [pattern.join(',')]);

  useEffect(() => {
    if (reduce) return scale.setValue(0.8);
    const target = phase === 0 ? 1 : phase === 2 ? 0.6 : null;
    if (target !== null) Animated.timing(scale, { toValue: target, duration: pattern[phase] * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
  }, [phase, reduce]);

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: size + 20 }} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${phase === 0 ? t('breathe.nose') : phase === 2 ? t('breathe.mouth') : labels[phase]}, ${count}`}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: BREATH_BLUE,
          opacity: 0.2,
          transform: [{ scale }],
        }}
      />
      <Animated.View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: size,
          backgroundColor: BREATH_BLUE,
          opacity: 0.9,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <Txt bold color="#FFFFFF" center>
          {labels[phase]}
        </Txt>
        <Text style={{ color: '#FFFFFF', fontSize: 26, fontFamily: theme.fonts.bold }}>{count}</Text>
      </Animated.View>
      </View>
      <View style={{ maxWidth: 320, gap: 4, alignItems: 'center' }}>
        <Txt bold center color={theme.colors.heading}>{phase === 0 ? t('breathe.nose') : phase === 2 ? t('breathe.mouth') : t('breathe.holdHow')}</Txt>
        <Txt variant="small" center color={theme.colors.body}>{t('breathe.count', { n: breaths })}</Txt>
        {showGuide ? <Txt variant="small" center color={theme.colors.body}>{t('breathe.guide')}</Txt> : null}
      </View>
    </View>
  );
}

/** Gently moving celebration art (trophy, balloons, stars). Still when "reduce motion" is on. */
export function CelebrationArt({ big }: { big?: boolean }) {
  const reduce = useReduceMotion();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = (v: Animated.Value, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const l1 = loop(a, 1400);
    const l2 = loop(b, 900);
    l1.start();
    l2.start();
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [reduce]);
  const float = { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] };
  const floatSlow = { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }] };
  const bounce = { transform: [{ scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) }] };
  const twinkle = { opacity: b.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) };
  const k = big ? 1.6 : 1;
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: 140 * k, height: 80 * k }}>
      <Animated.Text style={[{ position: 'absolute', left: 6 * k, top: 30 * k, fontSize: 26 * k }, float]}>🎈</Animated.Text>
      <Animated.Text style={[{ position: 'absolute', left: 40 * k, top: 0, fontSize: 18 * k }, floatSlow]}>🎉</Animated.Text>
      <Animated.Text style={[{ position: 'absolute', left: 52 * k, top: 18 * k, fontSize: 46 * k }, bounce]}>🏆</Animated.Text>
      <Animated.Text style={[{ position: 'absolute', right: 4 * k, top: 4 * k, fontSize: 14 * k }, twinkle]}>⭐</Animated.Text>
      <Animated.Text style={[{ position: 'absolute', right: 2 * k, bottom: 2 * k, fontSize: 18 * k }, twinkle]}>✨</Animated.Text>
    </View>
  );
}
