import { Tabs, Redirect } from 'expo-router';
import { Home, Search, Bookmark, User } from 'lucide-react-native';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, loading } = useIPTVAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#e50914',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ size, color }) => <Home size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ size, color }) => <Search size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          title: 'Minha Lista',
          tabBarIcon: ({ size, color }) => <Bookmark size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => <User size={size + 4} color={color} />,
        }}
      />
    </Tabs>
  );
}
