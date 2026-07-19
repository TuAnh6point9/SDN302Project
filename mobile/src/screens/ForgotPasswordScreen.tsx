import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { AuthStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được yêu cầu, thử lại sau'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Ionicons name="key-outline" size={44} color={colors.primary} />
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </Text>
          </View>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="mail-open-outline" size={32} color={colors.primaryDark} />
              <Text style={styles.successTitle}>Đã gửi yêu cầu</Text>
              <Text style={styles.successText}>
                Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới {email.trim()}.
                Mở email và làm theo hướng dẫn (liên kết sẽ mở trên trình duyệt), sau đó quay lại đăng nhập.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>Về đăng nhập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ban@email.com"
                placeholderTextColor={colors.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Gửi liên kết đặt lại</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
                <Text style={styles.linkMuted}>
                  Nhớ ra mật khẩu? <Text style={styles.link}>Đăng nhập</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32, gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  form: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 },
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
  error: { color: colors.error, fontSize: 13, marginTop: 8 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    alignSelf: 'stretch',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkWrap: { alignItems: 'center', marginTop: 16 },
  linkMuted: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700' },
  successBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  successText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
