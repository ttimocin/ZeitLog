import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const styles = createStyles(isDark);

  const content = {
    tr: {
      title: 'Gizlilik Politikası',
      lastUpdated: 'Son Güncelleme: 2025',
      sections: [
        {
          title: '1. Veri Toplama',
          content: 'ZeitLog, işe giriş-çıkış saatlerinizi kaydetmek için aşağıdaki verileri toplar:\n\n• E-posta adresi (Firebase Authentication için)\n• Giriş/çıkış saatleri ve tarihleri\n• Çalışma süreleri\n• Cihazınızda yerel olarak saklanan kayıtlar',
        },
        {
          title: '2. Veri Kullanımı',
          content: 'Toplanan veriler sadece şu amaçlarla kullanılır:\n\n• Uygulamanın temel işlevselliğini sağlamak\n• Verilerinizi Firebase üzerinden yedeklemek\n• Farklı cihazlarda verilerinize erişmenizi sağlamak\n\nVerileriniz hiçbir zaman üçüncü taraflarla paylaşılmaz veya reklam amaçlı kullanılmaz.',
        },
        {
          title: '3. Veri Saklama',
          content: 'Verileriniz:\n\n• Cihazınızda yerel olarak (AsyncStorage) saklanır\n• İsteğe bağlı olarak Firebase Firestore\'da bulut yedekleme olarak saklanır\n• Verileriniz sadece sizin hesabınıza bağlıdır ve başka kullanıcılar erişemez',
        },
        {
          title: '4. Güvenlik',
          content: 'Verilerinizin güvenliği için:\n\n• Firebase Authentication ile güvenli giriş\n• Firestore Security Rules ile veri erişim kontrolü\n• Tüm veriler şifreli bağlantılar üzerinden aktarılır',
        },
        {
          title: '5. Veri Silme',
          content: 'Hesabınızı silmek istediğinizde:\n\n• Uygulama içinden çıkış yapabilirsiniz\n• Firebase Console üzerinden hesabınızı silebilirsiniz\n• Yerel veriler uygulama silindiğinde otomatik olarak silinir',
        },
        {
          title: '6. Üçüncü Taraf Servisler',
          content: 'Uygulama aşağıdaki üçüncü taraf servisleri kullanır:\n\n• Firebase (Google): Authentication ve Firestore veritabanı\n• Bu servislerin gizlilik politikaları kendi web sitelerinde mevcuttur',
        },
        {
          title: '7. İletişim',
          content: 'Gizlilik politikası hakkında sorularınız için:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Issues sayfasından bize ulaşabilirsiniz',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: 2025',
      sections: [
        {
          title: '1. Data Collection',
          content: 'ZeitLog collects the following data to record your work check-in/out times:\n\n• Email address (for Firebase Authentication)\n• Check-in/out times and dates\n• Work durations\n• Records stored locally on your device',
        },
        {
          title: '2. Data Usage',
          content: 'Collected data is used only for:\n\n• Providing core app functionality\n• Backing up your data via Firebase\n• Allowing you to access your data on different devices\n\nYour data is never shared with third parties or used for advertising purposes.',
        },
        {
          title: '3. Data Storage',
          content: 'Your data is stored:\n\n• Locally on your device (AsyncStorage)\n• Optionally in Firebase Firestore as cloud backup\n• Your data is only linked to your account and other users cannot access it',
        },
        {
          title: '4. Security',
          content: 'For the security of your data:\n\n• Secure login with Firebase Authentication\n• Data access control with Firestore Security Rules\n• All data is transmitted over encrypted connections',
        },
        {
          title: '5. Data Deletion',
          content: 'When you want to delete your account:\n\n• You can sign out from within the app\n• You can delete your account via Firebase Console\n• Local data is automatically deleted when the app is uninstalled',
        },
        {
          title: '6. Third-Party Services',
          content: 'The app uses the following third-party services:\n\n• Firebase (Google): Authentication and Firestore database\n• Privacy policies for these services are available on their websites',
        },
        {
          title: '7. Contact',
          content: 'For questions about privacy policy:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• You can reach us via the Issues page',
        },
      ],
    },
    de: {
      title: 'Datenschutzerklärung',
      lastUpdated: 'Zuletzt aktualisiert: 2025',
      sections: [
        {
          title: '1. Datenerfassung',
          content: 'ZeitLog erfasst folgende Daten, um Ihre Arbeitszeiten zu erfassen:\n\n• E-Mail-Adresse (für Firebase Authentication)\n• Ein-/Ausstempelzeiten und -daten\n• Arbeitsdauern\n• Lokal auf Ihrem Gerät gespeicherte Einträge',
        },
        {
          title: '2. Datennutzung',
          content: 'Erfasste Daten werden nur verwendet für:\n\n• Bereitstellung der Kernfunktionalität der App\n• Sicherung Ihrer Daten über Firebase\n• Ermöglichen des Zugriffs auf Ihre Daten auf verschiedenen Geräten\n\nIhre Daten werden niemals an Dritte weitergegeben oder für Werbezwecke verwendet.',
        },
        {
          title: '3. Datenspeicherung',
          content: 'Ihre Daten werden gespeichert:\n\n• Lokal auf Ihrem Gerät (AsyncStorage)\n• Optional in Firebase Firestore als Cloud-Backup\n• Ihre Daten sind nur mit Ihrem Konto verknüpft und andere Benutzer können nicht darauf zugreifen',
        },
        {
          title: '4. Sicherheit',
          content: 'Für die Sicherheit Ihrer Daten:\n\n• Sichere Anmeldung mit Firebase Authentication\n• Datenzugriffskontrolle mit Firestore Security Rules\n• Alle Daten werden über verschlüsselte Verbindungen übertragen',
        },
        {
          title: '5. Datenlöschung',
          content: 'Wenn Sie Ihr Konto löschen möchten:\n\n• Sie können sich in der App abmelden\n• Sie können Ihr Konto über die Firebase Console löschen\n• Lokale Daten werden automatisch gelöscht, wenn die App deinstalliert wird',
        },
        {
          title: '6. Drittanbieterdienste',
          content: 'Die App verwendet folgende Drittanbieterdienste:\n\n• Firebase (Google): Authentifizierung und Firestore-Datenbank\n• Datenschutzrichtlinien für diese Dienste sind auf deren Websites verfügbar',
        },
        {
          title: '7. Kontakt',
          content: 'Bei Fragen zur Datenschutzerklärung:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Sie können uns über die Issues-Seite erreichen',
        },
      ],
    },
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentContent.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <Text style={styles.lastUpdated}>{currentContent.lastUpdated}</Text>

        {currentContent.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    lastUpdated: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginBottom: 24,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      marginBottom: 12,
    },
    sectionContent: {
      fontSize: 14,
      lineHeight: 22,
      color: isDark ? '#ccc' : '#666',
    },
  });

