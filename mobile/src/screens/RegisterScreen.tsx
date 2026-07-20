import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { authApi } from '../api';
import { getApiErrorMessage, API_BASE_URL, setAuthToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);

  const handleRegister = async () => {
    if (name.trim().length < 2) return setError('Tên tối thiểu 2 ký tự');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Email không hợp lệ');
    if (password.length < 8) return setError('Mật khẩu tối thiểu 8 ký tự');
    if (password !== confirm) return setError('Mật khẩu nhập lại không khớp');

    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      });
      navigation.navigate('Otp', { email: res.email });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại, thử lại sau'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.heading}>Tạo tài khoản</Text>
          <Text style={styles.subheading}>Mã xác thực OTP sẽ được gửi tới email của bạn</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="Nguyễn Văn A" placeholderTextColor={colors.textPlaceholder} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="ban@email.com" placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Số điện thoại (tùy chọn)</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone}
              placeholder="0901234567" placeholderTextColor={colors.textPlaceholder}
              keyboardType="phone-pad" />

            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="Tối thiểu 8 ký tự" placeholderTextColor={colors.textPlaceholder}
              secureTextEntry />

            <Text style={styles.label}>Nhập lại mật khẩu</Text>
            <TextInput style={styles.input} value={confirm} onChangeText={setConfirm}
              placeholder="••••••••" placeholderTextColor={colors.textPlaceholder}
              secureTextEntry />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={() => setGoogleModalVisible(true)}>
              <Ionicons name="logo-google" size={20} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={googleModalVisible}
        animationType="slide"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setGoogleModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Đăng nhập Google</Text>
            <View style={{ width: 24 }} />
          </View>
          <WebView
            source={{ uri: `${API_BASE_URL}/api/auth/google` }}
            style={{ flex: 1 }}
            onNavigationStateChange={async (navState) => {
              const url = navState.url;
              if (url.includes('/auth-callback')) {
                const match = url.match(/token=([^&]+)/);
                if (match && match[1]) {
                  const token = match[1];
                  setGoogleModalVisible(false);
                  setLoading(true);
                  try {
                    setAuthToken(token);
                    const user = await authApi.getMe();
                    await login(user, token);
                  } catch (err) {
                    setError('Đăng nhập bằng Google thất bại');
                  } finally {
                    setLoading(false);
                  }
                }
              }
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24 },
  backBtn: { marginBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  subheading: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
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
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    marginHorizontal: 12,
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  googleBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
