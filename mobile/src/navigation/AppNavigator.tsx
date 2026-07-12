import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import DailyRewardModal from '../components/DailyRewardModal';
import { useAuth } from '../context/AuthContext';
import BookDetailScreen from '../screens/BookDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OtpScreen from '../screens/OtpScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WishlistScreen from '../screens/WishlistScreen';
import { colors } from '../theme/colors';
import MainTabs from './MainTabs';
import { AuthStackParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
};

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <>
          <RootStack.Navigator screenOptions={stackScreenOptions}>
            <RootStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
            <RootStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Chi tiết sách' }} />
            <RootStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Đặt hàng' }} />
            <RootStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Chi tiết đơn hàng' }} />
            <RootStack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Yêu thích' }} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
          </RootStack.Navigator>
          <DailyRewardModal />
        </>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="Otp" component={OtpScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
