import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function OtpScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'Otp'>>();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) return setError('Mã OTP gồm 6 chữ số');
    setError('');
    setLoading(true);
    try {
      const { user, token } = await authApi.verifyOtp(params.email, otp.trim());
      await login(user, token);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Xác thực thất bại, thử lại'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const res = await authApi.resendOtp(params.email);
      setInfo(res.message ?? 'Đã gửi lại mã OTP');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi lại được mã, thử lại sau'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Ionicons name="mail-open-outline" size={48} color={colors.primary} style={{ alignSelf: 'center' }} />
        <Text style={styles.heading}>Nhập mã OTP</Text>
        <Text style={styles.subheading}>
          Mã xác thực 6 số đã gửi tới{'\n'}
          <Text style={{ fontWeight: '700', color: colors.text }}>{params.email}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textPlaceholder}
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={styles.linkWrap}>
          <Text style={styles.link}>Gửi lại mã</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 12, left: 24 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', marginTop: 16 },
  subheading: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 56,
    marginTop: 24,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 12,
    color: colors.text,
  },
  error: { color: colors.error, fontSize: 13, marginTop: 12, textAlign: 'center' },
  info: { color: colors.success, fontSize: 13, marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkWrap: { alignItems: 'center', marginTop: 16 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
