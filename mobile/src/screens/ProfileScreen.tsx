import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) return setPasswordError('Mật khẩu mới tối thiểu 8 ký tự');
    if (newPassword !== confirm) return setPasswordError('Mật khẩu nhập lại không khớp');
    setPasswordError('');
    setChanging(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Không đổi được mật khẩu'));
    } finally {
      setChanging(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.email}>{user.phone}</Text> : null}
        <View style={styles.pointsPill}>
          <Ionicons name="leaf" size={14} color={colors.primaryDark} />
          <Text style={styles.pointsText}>{user?.points ?? 0} điểm thưởng</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart-outline" size={20} color={colors.text} />
          <Text style={styles.menuText}>Sách yêu thích</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <Text style={styles.menuText}>Thông báo</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPasswordForm((v) => !v)}
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
          <Ionicons
            name={showPasswordForm ? 'chevron-up' : 'chevron-forward'}
            size={18}
            color={colors.textPlaceholder}
          />
        </TouchableOpacity>

        {showPasswordForm && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor={colors.textPlaceholder}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
              placeholderTextColor={colors.textPlaceholder}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.textPlaceholder}
              secureTextEntry
            />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={changing}>
              {changing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Lưu mật khẩu mới</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F1E9',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  passwordForm: { padding: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.text,
  },
  error: { color: colors.error, fontSize: 12 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.md,
    height: 46,
    marginTop: 16,
  },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: 14 },
});
