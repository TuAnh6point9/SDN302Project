import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User, Heart, Bell, Lock, ChevronRight, LogOut, Package,
  Leaf, Settings, ChevronDown, ChevronUp, HelpCircle, Info
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import GreenButton from '../components/GreenButton';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

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

  // Custom Navigation Header Setup
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Tài khoản',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 18, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: spacing.sm }} onPress={() => Alert.alert('Cài đặt', 'Chức năng đang phát triển')}>
          <Settings size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const MenuItem = ({ icon: Icon, title, onPress, rightIcon: RightIcon = ChevronRight }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon size={20} color={colors.textSecondary} />
      <Text style={styles.menuText}>{title}</Text>
      <RightIcon size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.name?.charAt(0).toUpperCase() ?? 'P'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Phuc'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'de180994letrongphuc@gmail.com'}</Text>
          
          <View style={styles.rewardBadge}>
            <Leaf size={14} color={colors.primary} fill={colors.primary} />
            <Text style={styles.rewardPointsText}>{user?.points ?? 0} điểm thưởng</Text>
          </View>
        </View>

        {/* Menu Group Card */}
        <View style={styles.menuGroupCard}>
          <MenuItem 
            icon={User} 
            title="Chỉnh sửa hồ sơ" 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Heart} 
            title="Sách yêu thích" 
            onPress={() => navigation.navigate('Wishlist')} 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Bell} 
            title="Thông báo" 
            onPress={() => navigation.navigate('Notifications')} 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Lock} 
            title="Đổi mật khẩu" 
            onPress={() => setShowPasswordForm((v) => !v)} 
            rightIcon={showPasswordForm ? ChevronUp : ChevronDown}
          />

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <View style={styles.formDivider} />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Mật khẩu hiện tại"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              <GreenButton 
                title="Cập nhật mật khẩu" 
                onPress={handleChangePassword} 
                loading={changing}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}

          <View style={styles.menuDivider} />
          <MenuItem 
            icon={HelpCircle} 
            title="Trợ giúp & hỗ trợ" 
            onPress={() => Alert.alert('Hỗ trợ', 'Vui lòng liên hệ support@greenleafbooks.vn')} 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Info} 
            title="Giới thiệu ứng dụng" 
            onPress={() => Alert.alert('Giới thiệu', 'GreenLeaf Books v1.0.0 - Premium Book Store Application')} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarLetter: {
    ...typography.largeTitle,
    fontSize: 32,
    color: colors.surface,
    fontWeight: '700',
  },
  profileName: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  rewardPointsText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  menuGroupCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuText: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  passwordForm: {
    padding: spacing.md,
    paddingTop: 0,
    backgroundColor: colors.surface,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    ...typography.body,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 16,
    height: 52,
    marginBottom: spacing.md,
  },
  logoutText: {
    ...typography.h3,
    fontSize: 16,
    color: colors.error,
    fontWeight: '700',
  },
});
