// FinanceFlow - 4 Sayfalı Onboarding Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import CustomButton from '../components/ui/CustomButton';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, [currentPage]);

  const onboardingData = [
    {
      id: 1,
      title: "Mali Özgürlük",
      subtitle: "Finansal hedeflerinize ulaşın",
      description: "FinanceFlow ile paranızı akıllıca yönetin, tasarruf edin ve mali özgürlüğünüze kavuşun.",
      icon: "trending-up",
      gradientColors: ['#667eea', '#764ba2']
    },
    {
      id: 2,
      title: "Akıllı Takip",
      subtitle: "AI destekli harcama takibi",
      description: "Fişlerinizi taratın, otomatik kategorilendirme ile harcamalarınızı zahmetsizce takip edin.",
      icon: "camera-enhance",
      gradientColors: ['#f093fb', '#f5576c']
    },
    {
      id: 3,
      title: "Görsel Analiz",
      subtitle: "Detaylı raporlar ve grafikler",
      description: "Harcama alışkanlıklarınızı görsel raporlarla analiz edin, tasarruf fırsatlarını keşfedin.",
      icon: "insert-chart",
      gradientColors: ['#4facfe', '#00f2fe']
    },
    {
      id: 4,
      title: "Aile Planı",
      subtitle: "Birlikte daha güçlü",
      description: "Ailenizle ortak bütçe oluşturun, birlikte hedefler belirleyin ve finansal başarınızı artırın.",
      icon: "group-work",
      gradientColors: ['#43e97b', '#38f9d7']
    }
  ];

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    
    if (page !== currentPage) {
      // Smooth transition animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentPage(page);
    }
  };

  const goToPage = (pageIndex) => {
    scrollViewRef.current?.scrollTo({
      x: pageIndex * width,
      animated: true,
    });
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      goToPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  const handleSkip = async () => {
    // Onboarding'i atla ve auth ekranına git
    await completeOnboarding();
    navigation.replace('Auth');
  };

  const handleFinish = async () => {
    // Onboarding tamamlandı, auth ekranına git
    await completeOnboarding();
    navigation.replace('Auth');
  };

  const renderPage = (item, index) => {
    return (
      <View key={item.id} style={styles.page}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pageContent}>
            {/* Hero Section */}
            <Animated.View 
              style={[
                styles.heroSection,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <MaterialIcons 
                  name={item.icon} 
                  size={90} 
                  color="rgba(255,255,255,0.95)" 
                />
              </Animated.View>
              
              <Text style={styles.pageTitle}>{item.title}</Text>
              <Text style={styles.pageSubtitle}>{item.subtitle}</Text>
            </Animated.View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <View style={styles.descriptionCard}>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPageIndicators = () => {
    return (
      <View style={styles.pageIndicators}>
        {onboardingData.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              currentPage === index ? styles.activeIndicator : styles.inactiveIndicator
            ]}
            onPress={() => goToPage(index)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Pages - Full Screen */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderPage(item, index))}
      </ScrollView>

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerLeft}>
          {currentPage > 0 && (
            <TouchableOpacity onPress={handlePrevious} style={styles.headerButton}>
              <MaterialIcons name="arrow-back" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {currentPage < onboardingData.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={styles.headerButton}>
              <Text style={styles.skipText}>Atla</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Floating Footer */}
      <View style={styles.floatingFooter}>
        {renderPageIndicators()}
        
        <View style={styles.buttonContainer}>
          <CustomButton
            title={currentPage === onboardingData.length - 1 ? "Başlayalım" : "Devam"}
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    zIndex: 10,
  },
  
  headerLeft: {
    width: 50,
  },
  
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  
  skipText: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  
  scrollView: {
    flex: 1,
  },
  
  page: {
    width: width,
    flex: 1,
  },
  
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 100,
    paddingBottom: 120,
  },
  
  heroSection: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  pageTitle: {
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '800',
    letterSpacing: -1,
  },
  
  pageSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 28,
    paddingHorizontal: theme.spacing.md,
  },
  
  descriptionSection: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: theme.spacing.xl,
  },
  
  descriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  floatingFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xl,
    zIndex: 10,
  },
  
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  activeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 30,
    borderRadius: 15,
    transform: [{ scaleY: 1.2 }],
  },
  
  inactiveIndicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  buttonContainer: {
    width: '100%',
  },
  
  nextButton: {
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.large,
  },
});

export default OnboardingScreen;