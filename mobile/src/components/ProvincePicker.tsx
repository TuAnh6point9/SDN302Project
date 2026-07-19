import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PROVINCES } from '../constants/provinces';
import { colors, radius } from '../theme/colors';

interface Props {
  value: string;
  onChange: (province: string) => void;
}

// Dropdown chọn tỉnh/thành bằng Modal + FlatList có sẵn của RN, không cần thêm thư viện picker.
export default function ProvincePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || 'Chọn tỉnh / thành phố'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Chọn tỉnh / thành phố</Text>
            <FlatList
              data={PROVINCES}
              keyExtractor={(item) => item}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={item === value ? styles.optionTextActive : styles.optionText}>{item}</Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  valueText: { fontSize: 15, color: colors.text },
  placeholderText: { fontSize: 15, color: colors.textPlaceholder },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    padding: 16,
    maxHeight: '70%',
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 14, color: colors.text },
  optionTextActive: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  closeBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
