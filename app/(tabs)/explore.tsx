import { useModal } from '@/components/custom-modal';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { exportToCSV, getDailySummaries, importFromCSV } from '@/services/export';
import { syncAllPendingRecords } from '@/services/firebase-sync';
import { addHolidayRecord, removeHolidayRecord } from '@/services/storage';
import { DailySummary } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Günlük çalışma süresi (dakika) - 7 saat (net çalışma, mola hariç)
const DAILY_WORK_MINUTES = 420;

// Haftalık çalışma süresi (dakika) - 35 saat
const WEEKLY_WORK_MINUTES = 2100;

// Mola süresi (dakika) - 30 dakika
const BREAK_MINUTES = 30;

// Hafta bilgisi tipi
interface WeekDayData {
  dayName: string;
  shortName: string;
  date: string;
  giris: string | null;
  cikis: string | null;
  duration: number;
  durationText: string;
  overtime: number;
  overtimeText: string;
  isHoliday: boolean;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  days: WeekDayData[];
  totalMinutes: number;
  totalText: string;
  totalOvertime: number;
  totalOvertimeText: string;
  isCurrentWeek: boolean;
}

// Haftanın başlangıç tarihini al (Pazartesi)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Tarih formatla
const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Süreyi dakikadan saat:dakika formatına çevir
const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

// Fazla/eksik süreyi formatla
const formatOvertime = (minutes: number): string => {
  if (minutes === 0) return '-';
  const sign = minutes > 0 ? '+' : '';
  return `${sign}${minutes}`;
};

// Kısa gün adları
const shortDayNames: Record<string, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
};

const fullDayNames: Record<string, string[]> = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
};

export default function RecordsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate, language } = useLanguage();
  const { showModal, showWarning, showError, showInfo, ModalComponent } = useModal();
  
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const loadSummaries = useCallback(async () => {
    const data = await getDailySummaries();
    setSummaries(data);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadSummaries();
    }, [loadSummaries])
  );
  
  // Çalışma süresini hesapla (mola dahil)
  const calculateDuration = (giris: string | null, cikis: string | null, isHoliday: boolean = false): { duration: number; netDuration: number; overtime: number } => {
    if (!giris || !cikis) return { duration: 0, netDuration: 0, overtime: 0 };
    const [girisH, girisM] = giris.split(':').map(Number);
    const [cikisH, cikisM] = cikis.split(':').map(Number);
    const grossDuration = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);
    
    if (grossDuration <= 0) return { duration: 0, netDuration: 0, overtime: 0 };
    
    // Tatil günlerinde mola düşme (zaten 7 saat net olarak ekleniyor)
    const netDuration = isHoliday ? grossDuration : grossDuration - BREAK_MINUTES;
    const overtime = netDuration - DAILY_WORK_MINUTES;
    
    return { duration: grossDuration, netDuration: netDuration > 0 ? netDuration : 0, overtime };
  };
  
  // Güne tıklama - tatil ekleme/kaldırma
  const handleDayPress = (day: WeekDayData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Gelecek tarihler için işlem yapma
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    if (dayDate > today) {
      return;
    }
    
    if (day.isHoliday) {
      // Tatil kaldır
      showModal({
        title: i18n.t('removeHoliday'),
        message: i18n.t('removeHolidayConfirm'),
        icon: '🗑️',
        buttons: [
          { text: i18n.t('cancel'), style: 'cancel' },
          {
            text: i18n.t('remove'),
            style: 'destructive',
            onPress: async () => {
              await removeHolidayRecord(day.date);
              await loadSummaries();
            },
          },
        ],
      });
    } else if (!day.giris && !day.cikis) {
      // Boş gün - tatil ekle
      showModal({
        title: i18n.t('addHoliday'),
        message: i18n.t('addHolidayConfirm'),
        icon: '🏖️',
        buttons: [
          { text: i18n.t('cancel'), style: 'cancel' },
          {
            text: i18n.t('addHolidayBtn'),
            style: 'default',
            onPress: async () => {
              await addHolidayRecord(day.date);
              await loadSummaries();
            },
          },
        ],
      });
    }
  };
  
  // Haftalık verileri hesapla
  const weeklyData = useMemo((): WeekData[] => {
    const weeks: Map<string, WeekData> = new Map();
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const lang = language || 'tr';
    
    // Summaries'den haftalık veri oluştur
    for (const summary of summaries) {
      const date = new Date(summary.date);
      const weekStart = getWeekStart(date);
      const weekKey = formatDateStr(weekStart);
      
      if (!weeks.has(weekKey)) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 4);
        
        const isCurrentWeek = weekKey === formatDateStr(currentWeekStart);
        
        weeks.set(weekKey, {
          weekStart: weekKey,
          weekEnd: formatDateStr(weekEnd),
          weekLabel: isCurrentWeek ? i18n.t('thisWeek') : `${weekStart.getDate()}.${weekStart.getMonth() + 1} - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`,
          days: Array(5).fill(null).map((_, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            return {
              dayName: fullDayNames[lang]?.[i] || fullDayNames.tr[i],
              shortName: shortDayNames[lang]?.[i] || shortDayNames.tr[i],
              date: formatDateStr(dayDate),
              giris: null,
              cikis: null,
              duration: 0,
              durationText: '-',
              overtime: 0,
              overtimeText: '-',
              isHoliday: false,
            };
          }),
          totalMinutes: 0,
          totalText: '-',
          totalOvertime: 0,
          totalOvertimeText: '-',
          isCurrentWeek,
        });
      }
      
      // Bu günün verilerini ekle
      const week = weeks.get(weekKey)!;
      const dayOfWeek = date.getDay();
      const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
      
      if (dayIndex >= 0 && dayIndex < 5) {
        week.days[dayIndex].giris = summary.giris || null;
        week.days[dayIndex].cikis = summary.cikis || null;
        week.days[dayIndex].isHoliday = summary.isHoliday || false;
        
        const { netDuration, overtime } = calculateDuration(
          summary.giris || null, 
          summary.cikis || null, 
          summary.isHoliday || false
        );
        if (netDuration > 0) {
          week.days[dayIndex].duration = netDuration;
          week.days[dayIndex].durationText = formatDuration(netDuration);
          week.days[dayIndex].overtime = overtime;
          week.days[dayIndex].overtimeText = formatOvertime(overtime);
          week.totalMinutes += netDuration;
        }
      }
    }
    
    // Toplamları güncelle (haftalık 35 saat = 2100 dakika baz alınarak)
    for (const week of weeks.values()) {
      if (week.totalMinutes > 0) {
        week.totalText = formatDuration(week.totalMinutes);
        week.totalOvertime = week.totalMinutes - WEEKLY_WORK_MINUTES;
        week.totalOvertimeText = formatOvertime(week.totalOvertime);
      }
    }
    
    // Güncel hafta yoksa ekle
    const currentWeekKey = formatDateStr(currentWeekStart);
    if (!weeks.has(currentWeekKey)) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      
      weeks.set(currentWeekKey, {
        weekStart: currentWeekKey,
        weekEnd: formatDateStr(weekEnd),
        weekLabel: i18n.t('thisWeek'),
        days: Array(5).fill(null).map((_, i) => {
          const dayDate = new Date(currentWeekStart);
          dayDate.setDate(dayDate.getDate() + i);
          return {
            dayName: fullDayNames[lang]?.[i] || fullDayNames.tr[i],
            shortName: shortDayNames[lang]?.[i] || shortDayNames.tr[i],
            date: formatDateStr(dayDate),
            giris: null,
            cikis: null,
            duration: 0,
            durationText: '-',
            overtime: 0,
            overtimeText: '-',
            isHoliday: false,
          };
        }),
        totalMinutes: 0,
        totalText: '-',
        totalOvertime: 0,
        totalOvertimeText: '-',
        isCurrentWeek: true,
      });
    }
    
    return Array.from(weeks.values()).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [summaries, language]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummaries();
    setRefreshing(false);
  };
  
  const handleExport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (summaries.length === 0) {
      showWarning(i18n.t('warning'), i18n.t('noRecordsToExport'));
      return;
    }
    
    const success = await exportToCSV();
    if (!success) {
      showError(i18n.t('error'), i18n.t('exportFailed'));
    }
  };
  
  const handleImport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await importFromCSV();
    
    if (result.error === 'cancelled') {
      return;
    }
    
    const totalChanges = result.imported + (result.updated || 0);
    
    if (result.success && totalChanges > 0) {
      let message = '';
      if (result.imported > 0) {
        message += `${result.imported} ${i18n.t('importedRecords')}`;
      }
      if (result.updated && result.updated > 0) {
        if (message) message += '\n';
        message += `${result.updated} ${i18n.t('updatedRecords')}`;
      }
      showModal({
        title: i18n.t('importSuccess'),
        message,
        icon: '✅',
        buttons: [{ text: 'Tamam', style: 'default' }],
      });
      await loadSummaries();
    } else if (result.success && totalChanges === 0) {
      showInfo(i18n.t('info'), i18n.t('noNewRecordsToImport'));
    } else {
      showError(i18n.t('error'), i18n.t('importFailed'));
    }
  };
  
  const handleSync = async () => {
    setSyncing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await syncAllPendingRecords();
    
    if (result.notLoggedIn) {
      showInfo(i18n.t('info'), i18n.t('loginToSync'));
    } else if (result.success > 0 || result.failed > 0) {
      showModal({
        title: i18n.t('syncComplete'),
        message: `${i18n.t('successful')}: ${result.success}\n${i18n.t('failed')}: ${result.failed}`,
        icon: result.failed > 0 ? '⚠️' : '☁️',
        buttons: [{ text: 'Tamam', style: 'default' }],
      });
    } else {
      showInfo(i18n.t('info'), i18n.t('noRecordsToSync'));
    }
    
    setSyncing(false);
  };
  
  const styles = createStyles(isDark);
  
  // Saat renklendirmesi - geç kalma veya erken çıkış kontrolü
  const getTimeColor = (time: string | null, type: 'giris' | 'cikis'): string => {
    if (!time) return isDark ? '#999' : '#ccc';
    
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (type === 'giris') {
      // 08:00'dan sonra giriş = geç kalma (kırmızı)
      if (totalMinutes > 8 * 60) return '#ef4444';
      // Normal giriş (yeşil)
      if (totalMinutes >= 7 * 60 && totalMinutes <= 8 * 60) return '#10b981';
    } else {
      // 17:00'dan önce çıkış = erken çıkış (kırmızı)
      if (totalMinutes < 17 * 60) return '#ef4444';
      // Normal çıkış (yeşil)
      if (totalMinutes >= 17 * 60 && totalMinutes <= 18 * 60) return '#10b981';
    }
    
    // Nötr renk
    return isDark ? '#e5e5e5' : '#1a1a1a';
  };

  const renderWeekCard = (week: WeekData) => (
    <View key={week.weekStart} style={[styles.weekCard, week.isCurrentWeek && styles.currentWeekCard]}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekLabel}>{week.weekLabel}</Text>
        <View style={styles.weekTotalContainer}>
          <Text style={styles.weekTotalValue}>{week.totalText}</Text>
          {week.totalMinutes > 0 && (
            <Text style={[
              styles.weekTotalOvertime,
              week.totalOvertime >= 0 ? styles.weekOvertimePositive : styles.weekOvertimeNegative
            ]}>
              {week.totalOvertimeText} {i18n.t('minuteShort')}
            </Text>
          )}
        </View>
      </View>
      
      {/* Tablo Başlıkları */}
      <View style={styles.tableHeader}>
        <View style={styles.headerDayName}>
          <Text style={styles.headerText}>Gün</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText}>{i18n.t('entry')}</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText}>{i18n.t('exit')}</Text>
        </View>
        <View style={styles.headerDurationCell}>
          <Text style={styles.headerText}>Süre</Text>
        </View>
        <View style={styles.headerOvertimeCell}>
          <Text style={styles.headerText}>±</Text>
        </View>
      </View>
      
      {/* Günler - Satır bazlı görünüm */}
      <View style={styles.daysContainer}>
        {week.days.map((day, i) => {
          const isLateEntry = day.giris && getTimeColor(day.giris, 'giris') === '#ef4444';
          const isEarlyExit = day.cikis && getTimeColor(day.cikis, 'cikis') === '#ef4444';
          
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayRow,
                i < week.days.length - 1 && styles.dayRowBorder,
                day.isHoliday && styles.holidayRow
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              {/* Gün adı - Sol */}
              <View style={styles.dayNameContainer}>
                <Text style={styles.dayName}>{day.shortName}</Text>
                {day.isHoliday && (
                  <View style={styles.holidayTag}>
                    <Ionicons name="sunny-outline" size={12} color="#10b981" />
                  </View>
                )}
              </View>
              
              {/* Giriş saati */}
              <View style={styles.timeCell}>
                {day.giris ? (
                  <View style={[
                    styles.timeBadge,
                    isLateEntry && styles.timeBadgeError,
                    !isLateEntry && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      isLateEntry && styles.timeTextError,
                      !isLateEntry && styles.timeTextSuccess
                    ]}>
                      {day.giris}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.timeEmpty}>-</Text>
                )}
              </View>
              
              {/* Çıkış saati */}
              <View style={styles.timeCell}>
                {day.cikis ? (
                  <View style={[
                    styles.timeBadge,
                    isEarlyExit && styles.timeBadgeError,
                    !isEarlyExit && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      isEarlyExit && styles.timeTextError,
                      !isEarlyExit && styles.timeTextSuccess
                    ]}>
                      {day.cikis}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.timeEmpty}>-</Text>
                )}
              </View>
              
              {/* Süre */}
              <View style={styles.durationCell}>
                <Text style={[
                  styles.durationText,
                  day.duration > 0 && styles.durationTextFilled
                ]}>
                  {day.durationText}
                </Text>
              </View>
              
              {/* Fazla/Eksik */}
              <View style={styles.overtimeCell}>
                {day.duration > 0 ? (
                  <Text style={[
                    styles.overtimeText,
                    day.overtime > 0 && styles.overtimeTextPositive,
                    day.overtime < 0 && styles.overtimeTextNegative
                  ]}>
                    {day.overtimeText}
                  </Text>
                ) : (
                  <Text style={styles.overtimeEmpty}>-</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
  
  return (
    <SafeAreaView key={`history-${forceUpdate}`} style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('records')}</Text>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>
      
      {/* Alt başlık */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          {summaries.length} {i18n.t('daysRecorded')}
        </Text>
      </View>
      
      {/* Aksiyon Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons 
            name={syncing ? "cloud-upload" : "cloud-upload-outline"} 
            size={18} 
            color={isDark ? '#888' : '#666'} 
          />
          <Text style={styles.actionText}>
            {syncing ? i18n.t('syncing') : i18n.t('syncronize')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExport}
        >
          <Ionicons name="download-outline" size={18} color={isDark ? '#888' : '#666'} />
          <Text style={styles.actionText}>{i18n.t('downloadCSV')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImport}
        >
          <Ionicons name="document-text-outline" size={18} color={isDark ? '#888' : '#666'} />
          <Text style={styles.actionText}>{i18n.t('importCSV')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Haftalık Görünüm */}
      <ScrollView
        style={styles.weeklyContainer}
        contentContainerStyle={styles.weeklyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#fff' : '#333'}
          />
        }
      >
        {weeklyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>{i18n.t('noRecordsYet')}</Text>
            <Text style={styles.emptySubtext}>{i18n.t('addFromHome')}</Text>
          </View>
        ) : (
          weeklyData.map(renderWeekCard)
        )}
      </ScrollView>
      
      {/* Custom Modal */}
      <ModalComponent />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    settingsButton: {
      padding: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    subtitleContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#888' : '#999',
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#aaa' : '#666',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#888' : '#999',
      marginTop: 8,
    },
    // Weekly styles
    weeklyContainer: {
      flex: 1,
    },
    weeklyContent: {
      padding: 20,
      paddingTop: 16,
    },
    weekCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    currentWeekCard: {
      borderWidth: 1.5,
      borderColor: '#10b981',
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    weekLabel: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#fff' : '#1a1a1a',
      letterSpacing: -0.5,
    },
    weekTotalContainer: {
      alignItems: 'flex-end',
      gap: 4,
    },
    weekTotalValue: {
      fontSize: 24,
      fontWeight: '800',
      color: '#10b981',
      letterSpacing: -0.5,
    },
    weekTotalOvertime: {
      fontSize: 13,
      fontWeight: '600',
    },
    weekOvertimePositive: {
      color: '#10b981',
    },
    weekOvertimeNegative: {
      color: '#ef4444',
    },
    // Tablo Başlıkları
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    headerDayName: {
      width: 50,
    },
    headerTimeCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerDurationCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerOvertimeCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#888' : '#999',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Günler - Satır bazlı görünüm
    daysContainer: {
      gap: 0,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 4,
    },
    dayRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    holidayRow: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
      borderRadius: 8,
      marginHorizontal: -4,
      paddingHorizontal: 8,
    },
    dayNameContainer: {
      width: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dayName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
    },
    holidayTag: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    timeBadgeSuccess: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    },
    timeBadgeError: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    },
    timeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    timeTextSuccess: {
      color: '#10b981',
    },
    timeTextError: {
      color: '#ef4444',
    },
    timeEmpty: {
      fontSize: 13,
      color: isDark ? '#666' : '#ccc',
      fontWeight: '400',
    },
    durationCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#999' : '#aaa',
    },
    durationTextFilled: {
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      fontWeight: '600',
    },
    overtimeCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overtimeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    overtimeTextPositive: {
      color: '#10b981',
    },
    overtimeTextNegative: {
      color: '#ef4444',
    },
    overtimeEmpty: {
      fontSize: 13,
      color: isDark ? '#666' : '#ccc',
      fontWeight: '400',
    },
  });
