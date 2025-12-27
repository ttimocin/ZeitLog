import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';

export default function TermsOfServiceScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const styles = createStyles(isDark);

  const content = {
    tr: {
      title: 'Kullanım Koşulları',
      lastUpdated: 'Son Güncelleme: 2025',
      sections: [
        {
          title: '1. Kabul',
          content: 'ZeitLog uygulamasını kullanarak, bu Kullanım Koşullarını kabul etmiş sayılırsınız. Uygulamayı kullanmaya devam ederseniz, bu koşullara bağlı kalmayı kabul edersiniz.',
        },
        {
          title: '2. Hizmet Açıklaması',
          content: 'ZeitLog, işe giriş-çıkış saatlerinizi kaydetmenizi sağlayan ücretsiz bir mobil uygulamadır. Uygulama:\n\n• Giriş/çıkış saatlerinizi kaydetmenize olanak tanır\n• Verilerinizi Firebase üzerinden yedeklemenize izin verir\n• CSV formatında veri dışa aktarma özelliği sunar\n• Tamamen ücretsiz ve reklamsızdır',
        },
        {
          title: '3. Kullanıcı Sorumlulukları',
          content: 'Uygulamayı kullanırken:\n\n• Hesap bilgilerinizi güvende tutmak sizin sorumluluğunuzdadır\n• Verilerinizin doğruluğundan siz sorumlusunuz\n• Uygulamayı yasalara aykırı amaçlarla kullanamazsınız\n• Başkalarının hesaplarına erişmeye çalışamazsınız',
        },
        {
          title: '4. Hizmet Kullanılabilirliği',
          content: 'ZeitLog, hizmeti kesintisiz sağlamaya çalışır ancak:\n\n• Zaman zaman bakım veya güncellemeler nedeniyle hizmet kesintileri olabilir\n• İnternet bağlantısı gerektiren özellikler (Firebase senkronizasyonu) bağlantı durumuna bağlıdır\n• Uygulama çevrimdışı modda da çalışabilir',
        },
        {
          title: '5. Fikri Mülkiyet',
          content: 'ZeitLog ve tüm içeriği, telif hakkı ve diğer fikri mülkiyet yasalarıyla korunmaktadır. Uygulama MIT Lisansı altında açık kaynaklıdır.',
        },
        {
          title: '6. Sorumluluk Reddi',
          content: 'ZeitLog:\n\n• Verilerinizin kaybolmasından sorumlu tutulamaz\n• Uygulama kullanımından kaynaklanan herhangi bir zarardan sorumlu değildir\n• "OLDUĞU GİBİ" sağlanır, garanti verilmez',
        },
        {
          title: '7. Değişiklikler',
          content: 'Bu Kullanım Koşulları zaman zaman güncellenebilir. Önemli değişiklikler kullanıcılara bildirilecektir. Değişikliklerden sonra uygulamayı kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.',
        },
        {
          title: '8. İletişim',
          content: 'Sorularınız veya önerileriniz için:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Issues sayfasından bize ulaşabilirsiniz',
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: 2025',
      sections: [
        {
          title: '1. Acceptance',
          content: 'By using the ZeitLog application, you agree to these Terms of Service. If you continue to use the app, you agree to be bound by these terms.',
        },
        {
          title: '2. Service Description',
          content: 'ZeitLog is a free mobile application that allows you to record your work check-in/out times. The app:\n\n• Allows you to record your check-in/out times\n• Allows you to backup your data via Firebase\n• Provides CSV data export functionality\n• Is completely free and ad-free',
        },
        {
          title: '3. User Responsibilities',
          content: 'When using the app:\n\n• You are responsible for keeping your account information secure\n• You are responsible for the accuracy of your data\n• You may not use the app for illegal purposes\n• You may not attempt to access others\' accounts',
        },
        {
          title: '4. Service Availability',
          content: 'ZeitLog strives to provide uninterrupted service, but:\n\n• Service interruptions may occur due to maintenance or updates\n• Features requiring internet connection (Firebase sync) depend on connection status\n• The app can also work in offline mode',
        },
        {
          title: '5. Intellectual Property',
          content: 'ZeitLog and all its content are protected by copyright and other intellectual property laws. The app is open source under the MIT License.',
        },
        {
          title: '6. Disclaimer',
          content: 'ZeitLog:\n\n• Cannot be held responsible for loss of your data\n• Is not liable for any damages arising from app usage\n• Is provided "AS IS" without warranty',
        },
        {
          title: '7. Changes',
          content: 'These Terms of Service may be updated from time to time. Significant changes will be notified to users. Continued use of the app after changes means you accept the updated terms.',
        },
        {
          title: '8. Contact',
          content: 'For questions or suggestions:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• You can reach us via the Issues page',
        },
      ],
    },
    de: {
      title: 'Nutzungsbedingungen',
      lastUpdated: 'Zuletzt aktualisiert: 2025',
      sections: [
        {
          title: '1. Annahme',
          content: 'Durch die Nutzung der ZeitLog-Anwendung stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie die App weiterhin nutzen, stimmen Sie zu, an diese Bedingungen gebunden zu sein.',
        },
        {
          title: '2. Dienstbeschreibung',
          content: 'ZeitLog ist eine kostenlose mobile Anwendung, mit der Sie Ihre Arbeitszeiten erfassen können. Die App:\n\n• Ermöglicht die Erfassung Ihrer Ein-/Ausstempelzeiten\n• Ermöglicht die Sicherung Ihrer Daten über Firebase\n• Bietet CSV-Datenexport-Funktionalität\n• Ist vollständig kostenlos und werbefrei',
        },
        {
          title: '3. Benutzerverantwortlichkeiten',
          content: 'Bei der Nutzung der App:\n\n• Sie sind dafür verantwortlich, Ihre Kontoinformationen sicher zu halten\n• Sie sind für die Richtigkeit Ihrer Daten verantwortlich\n• Sie dürfen die App nicht für illegale Zwecke verwenden\n• Sie dürfen nicht versuchen, auf andere Konten zuzugreifen',
        },
        {
          title: '4. Dienstverfügbarkeit',
          content: 'ZeitLog bemüht sich, einen unterbrechungsfreien Service zu bieten, aber:\n\n• Dienstunterbrechungen können aufgrund von Wartung oder Updates auftreten\n• Funktionen, die eine Internetverbindung erfordern (Firebase-Sync), hängen vom Verbindungsstatus ab\n• Die App kann auch im Offline-Modus arbeiten',
        },
        {
          title: '5. Geistiges Eigentum',
          content: 'ZeitLog und alle seine Inhalte sind durch Urheberrechte und andere Gesetze zum geistigen Eigentum geschützt. Die App ist unter der MIT-Lizenz Open Source.',
        },
        {
          title: '6. Haftungsausschluss',
          content: 'ZeitLog:\n\n• Kann nicht für den Verlust Ihrer Daten verantwortlich gemacht werden\n• Ist nicht haftbar für Schäden, die aus der App-Nutzung entstehen\n• Wird "WIE BESEHEN" ohne Gewährleistung bereitgestellt',
        },
        {
          title: '7. Änderungen',
          content: 'Diese Nutzungsbedingungen können von Zeit zu Zeit aktualisiert werden. Wesentliche Änderungen werden den Benutzern mitgeteilt. Die fortgesetzte Nutzung der App nach Änderungen bedeutet, dass Sie die aktualisierten Bedingungen akzeptieren.',
        },
        {
          title: '8. Kontakt',
          content: 'Bei Fragen oder Vorschlägen:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Sie können uns über die Issues-Seite erreichen',
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

