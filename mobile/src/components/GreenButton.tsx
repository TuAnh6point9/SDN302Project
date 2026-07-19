import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

interface GreenButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'filled' | 'outlined' | 'text';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function GreenButton({
  title,
  variant = 'filled',
  loading = false,
  style,
  disabled,
  ...rest
}: GreenButtonProps) {
  const isFilled = variant === 'filled';
  const isOutlined = variant === 'outlined';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[
        styles.button,
        isFilled && styles.filled,
        isOutlined && styles.outlined,
        isDisabled && isFilled && styles.disabledFilled,
        isDisabled && isOutlined && styles.disabledOutlined,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? colors.surface : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isFilled && styles.textFilled,
            (isOutlined || variant === 'text') && styles.textOutlined,
            isDisabled && !isFilled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  filled: {
    backgroundColor: colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabledFilled: {
    backgroundColor: colors.disabled,
  },
  disabledOutlined: {
    borderColor: colors.disabled,
  },
  text: {
    ...typography.h3,
    fontSize: 16,
  },
  textFilled: {
    color: colors.surface,
  },
  textOutlined: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.disabled,
  },
});
