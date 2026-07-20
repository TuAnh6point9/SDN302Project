import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, User } from 'lucide-react-native';
import { userApi } from '../api';
import GreenInput from '../components/GreenInput';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IUser } from '../types/models';

export default function AdminUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setUsers(await userApi.getUsers());
    } catch {
      Alert.alert('Lỗi', 'Không tải được danh sách thành viên');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Thành viên',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleActive = async (targetUser: IUser, newStatus: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: newStatus } : u))
    );
    try {
      await userApi.updateUser(targetUser._id, { isActive: newStatus });
    } catch {
      Alert.alert('Lỗi', 'Không cập nhật được trạng thái tài khoản');
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: !newStatus } : u))
      );
    }
  };

  const handleChangeRole = (targetUser: IUser) => {
    const nextRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    Alert.alert(
      'Thay đổi quyền hạn',
      `Bạn có muốn chuyển vai trò của ${targetUser.name} sang ${nextRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'} không?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Thay đổi',
          onPress: async () => {
            try {
              const updated = await userApi.updateUser(targetUser._id, { role: nextRole });
              setUsers((prev) =>
                prev.map((u) => (u._id === targetUser._id ? updated : u))
              );
              Alert.alert('Thành công', 'Đã cập nhật vai trò người dùng');
            } catch {
              Alert.alert('Lỗi', 'Không đổi được quyền hạn');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.headerFilters}>
        <GreenInput
          placeholder="Tìm tên, email thành viên..."
          value={search}
          onChangeText={setSearch}
          isSearch
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{item.name}</Text>
                {item.role === 'admin' && (
                  <ShieldCheck size={16} color={colors.primary} style={styles.shield} />
                )}
              </View>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userPoints}>Điểm tích lũy: {item.points ?? 0}</Text>

              <TouchableOpacity style={styles.roleBtn} onPress={() => handleChangeRole(item)}>
                <Text style={styles.roleBtnText}>Vai trò: {item.role === 'admin' ? 'Admin' : 'Khách hàng'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activeCol}>
              <Text style={styles.activeLabel}>{item.isActive ? 'Hoạt động' : 'Khoá'}</Text>
              <Switch
                value={item.isActive}
                onValueChange={(val) => handleToggleActive(item, val)}
                trackColor={{ false: '#767577', true: colors.primaryLight }}
                thumbColor={item.isActive ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerFilters: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: { padding: spacing.md, gap: spacing.md },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...typography.h2,
    fontSize: 18,
    color: colors.primary,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { ...typography.body, fontWeight: '700', fontSize: 14, color: colors.text },
  shield: { marginTop: 1 },
  userEmail: { ...typography.caption, color: colors.textSecondary },
  userPoints: { fontSize: 11, color: colors.textSecondary },
  roleBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 4,
  },
  roleBtnText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  activeCol: { alignItems: 'center', gap: 4 },
  activeLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
});
