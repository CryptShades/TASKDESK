import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../../src/theme';
import { api } from '../../../src/lib/api';
import { CampaignCard } from '../../../src/components/CampaignCard';
import { Search, X } from 'lucide-react-native';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ErrorState } from '../../../src/components/ErrorState';
import { EmptyState } from '../../../src/components/EmptyState';

const RISKS = [
  { id: 'all', label: 'All' },
  { id: 'high_risk', label: 'High Risk' },
  { id: 'at_risk', label: 'At Risk' },
  { id: 'normal', label: 'On Track' },
];

export default function CampaignListScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setError(null);
    const { data: result, error: apiError } = await api.get<any[]>('/api/campaigns');
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setCampaigns(result);
    }
    setLoading(false);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || c.risk_status === activeFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const priority: Record<string, number> = { high_risk: 0, at_risk: 1, normal: 2 };
        return (priority[a.risk_status] ?? 3) - (priority[b.risk_status] ?? 3);
      });
  }, [campaigns, searchQuery, activeFilter]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchCampaigns} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.foregroundMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search campaigns..."
              placeholderTextColor={theme.colors.foregroundMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
              <X size={20} color={theme.colors.foregroundMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text style={styles.title}>Campaigns</Text>
            <TouchableOpacity onPress={() => setIsSearching(true)}>
              <Search size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RISKS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.id)}
              style={[
                styles.filterChip,
                activeFilter === item.id && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  activeFilter === item.id && styles.activeLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CampaignCard
            id={item.id}
            name={item.name}
            clientName={item.client?.name || 'Unknown'}
            riskStatus={item.risk_status}
            launchDate={item.launch_date}
            overdueCount={item.task_stats?.overdue || 0}
            blockedCount={item.task_stats?.blocked || 0}
          />
        )}
        ListEmptyComponent={
          <EmptyState message="No campaigns match your search or filter." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.foreground,
    ...theme.typography.body,
  },
  filterBar: {
    marginBottom: theme.spacing.md,
  },
  filterList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterLabel: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  activeLabel: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
});
