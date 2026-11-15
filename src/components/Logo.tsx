// The official Project Serenity logo (assets/logo-mark.png, assets/logo-wordmark.png).
// `mono` tints the whole mark one colour, used by the escalation button (white on orange/red).
import React from 'react';
import { Image, Text, View } from 'react-native';
import { useApp } from '../lib/useApp';

const MARK = require('../../assets/logo-mark.png');
const WORDMARK = require('../../assets/logo-wordmark.png');
const MARK_RATIO = 498 / 512; // width / height of logo-mark.png

export default function Logo({ size = 96, mono }: { size?: number; mono?: string }) {
  return (
    <Image
      source={MARK}
      accessibilityIgnoresInvertColors
      accessible={false}
      style={{ width: size * MARK_RATIO, height: size, tintColor: mono }}
      resizeMode="contain"
    />
  );
}

/** "Project Serenity" name. Uses the artwork on light backgrounds and readable text in dark mode. */
export function Wordmark({ width = 260 }: { width?: number }) {
  const { theme } = useApp();
  if (!theme.dark)
    return (
      <Image
        source={WORDMARK}
        accessibilityRole="header"
        accessibilityLabel="Project Serenity"
        style={{ width, height: width * (119 / 800) }}
        resizeMode="contain"
      />
    );
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Project Serenity">
      <Text maxFontSizeMultiplier={1.5} style={{ fontFamily: theme.fonts.bold, fontSize: width / 8.2, letterSpacing: -0.5 }}>
        <Text style={{ color: '#9DB4EE' }}>Project </Text>
        <Text style={{ color: '#2BC4A0' }}>Serenity</Text>
      </Text>
    </View>
  );
}
