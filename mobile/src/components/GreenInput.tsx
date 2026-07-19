import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

interface GreenInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  isSearch?: boolean;
}

export default function GreenInput({
  containerStyle,
  icon,
  isSearch,
  style,
  ...rest
}: GreenInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {isSearch && !icon ? (
        <Search size={20} color={colors.textPlaceholder || colors.textSecondary} style={styles.icon} />
      ) : (
        icon && <View style={styles.icon}>{icon}</View>
      )}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textPlaceholder || colors.textSecondary}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    height: '100%',
    color: colors.text,
  },
});
