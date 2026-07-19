import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import type { IUserAddress } from '../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setUser } = useAuth();

  const defaultAddress: IUserAddress | undefined =
    user?.addresses?.find((address) => address.isDefault) ?? user?.addresses?.[0];

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [recipientName, setRecipientName] = useState(defaultAddress?.recipientName ?? '');
  const [addressPhone, setAddressPhone] = useState(defaultAddress?.phone ?? '');
  const [addressLine, setAddressLine] = useState(defaultAddress?.addressLine ?? '');
  const [city, setCity] = useState(defaultAddress?.city ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError('Tên tối thiểu 2 ký tự');
      return;
    }

    const addressFields = [recipientName, addressPhone, addressLine, city].map((v) => v.trim());
    const filledCount = addressFields.filter(Boolean).length;
    if (filledCount > 0 && filledCount < 4) {
      setError('Địa chỉ mặc định cần điền đủ 4 trường (hoặc để trống toàn bộ)');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const payload: Parameters<typeof authApi.updateMe>[0] = {
        name: name.trim(),
        phone: phone.trim() || undefined,
      };
      if (filledCount === 4) {
        payload.addresses = [{
          recipientName: recipientName.trim(),
          phone: addressPhone.trim(),
          addressLine: addressLine.trim(),
          city: city.trim(),
          isDefault: true,
        }];
      }
      const updated = await authApi.updateMe(payload);
      setUser(updated);
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ');
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được hồ sơ'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Họ và tên"
          placeholderTextColor={colors.textPlaceholder}
        />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="0901234567"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email} editable={false} />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Địa chỉ giao hàng mặc định</Text>
        <Text style={styles.hint}>Dùng để điền sẵn khi đặt hàng. Để trống toàn bộ nếu chưa cần.</Text>
        <Text style={styles.label}>Người nhận</Text>
        <TextInput
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Tên người nhận"
          placeholderTextColor={colors.textPlaceholder}
        />
        <Text style={styles.label}>SĐT người nhận</Text>
        <TextInput
          style={styles.input}
          value={addressPhone}
          onChangeText={setAddressPhone}
          placeholder="0901234567"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="Số nhà, đường, phường/xã"
          placeholderTextColor={colors.textPlaceholder}
        />
        <Text style={styles.label}>Tỉnh/Thành phố</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="TP. Hồ Chí Minh"
          placeholderTextColor={colors.textPlaceholder}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Lưu thay đổi</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: colors.text,
  },
  inputDisabled: { opacity: 0.6 },
  error: { color: colors.error, fontSize: 13, marginTop: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
