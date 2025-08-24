// FinanceFlow - Feedback Context Provider
import React, { createContext, useContext, useState } from 'react';
import FeedbackModal from '../components/ui/FeedbackModal';
import { useToastContext } from './ToastContext';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialType, setInitialType] = useState('general');
  const { showSuccess, showError } = useToastContext();

  const showFeedbackModal = (type = 'general') => {
    setInitialType(type);
    setIsModalVisible(true);
  };

  const hideFeedbackModal = () => {
    setIsModalVisible(false);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // TODO: Send feedback to backend service
      console.log('Feedback submitted:', feedbackData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock different responses based on feedback type
      if (feedbackData.type === 'bug') {
        await submitBugReport(feedbackData);
      } else if (feedbackData.type === 'feature') {
        await submitFeatureRequest(feedbackData);
      } else {
        await submitGeneralFeedback(feedbackData);
      }

      showSuccess('Geri bildiriminiz başarıyla gönderildi. Teşekkürler!', {
        duration: 5000,
        title: 'Başarılı'
      });

      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      showError('Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', {
        duration: 6000,
        title: 'Hata'
      });
      throw error;
    }
  };

  // Mock API functions
  const submitBugReport = async (feedbackData) => {
    // TODO: Integrate with bug tracking system (JIRA, Linear, GitHub Issues, etc.)
    const bugReport = {
      title: `Hata Bildirimi: ${feedbackData.description.substring(0, 50)}...`,
      description: feedbackData.description,
      steps: feedbackData.steps,
      expected: feedbackData.expected,
      actual: feedbackData.actual,
      severity: feedbackData.rating <= 2 ? 'high' : feedbackData.rating <= 3 ? 'medium' : 'low',
      reporter: {
        name: feedbackData.name,
        email: feedbackData.email,
      },
      environment: {
        platform: feedbackData.platform,
        appVersion: feedbackData.appVersion,
        timestamp: feedbackData.timestamp,
      },
      labels: ['user-reported', 'bug'],
    };

    console.log('Bug report to be submitted:', bugReport);
    // await bugTrackingAPI.createIssue(bugReport);
  };

  const submitFeatureRequest = async (feedbackData) => {
    // TODO: Integrate with product management tools
    const featureRequest = {
      title: `Özellik İsteği: ${feedbackData.description.substring(0, 50)}...`,
      description: feedbackData.description,
      benefit: feedbackData.benefit,
      priority: feedbackData.rating >= 4 ? 'high' : feedbackData.rating >= 3 ? 'medium' : 'low',
      requester: {
        name: feedbackData.name,
        email: feedbackData.email,
      },
      metadata: {
        platform: feedbackData.platform,
        appVersion: feedbackData.appVersion,
        timestamp: feedbackData.timestamp,
      },
      labels: ['user-requested', 'feature'],
    };

    console.log('Feature request to be submitted:', featureRequest);
    // await productAPI.createFeatureRequest(featureRequest);
  };

  const submitGeneralFeedback = async (feedbackData) => {
    // TODO: Send to customer success or product team
    const generalFeedback = {
      type: feedbackData.type,
      rating: feedbackData.rating,
      message: feedbackData.description,
      improvements: {
        current: feedbackData.current,
        suggested: feedbackData.suggested,
      },
      contact: {
        name: feedbackData.name,
        email: feedbackData.email,
      },
      metadata: {
        platform: feedbackData.platform,
        appVersion: feedbackData.appVersion,
        timestamp: feedbackData.timestamp,
      },
    };

    console.log('General feedback to be submitted:', generalFeedback);
    // await feedbackAPI.submitFeedback(generalFeedback);
  };

  // Convenience methods for different feedback types
  const reportBug = () => showFeedbackModal('bug');
  const requestFeature = () => showFeedbackModal('feature');
  const suggestImprovement = () => showFeedbackModal('improvement');
  const giveFeedback = () => showFeedbackModal('general');

  const contextValue = {
    showFeedbackModal,
    hideFeedbackModal,
    reportBug,
    requestFeature,
    suggestImprovement,
    giveFeedback,
    isModalVisible,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackModal
        visible={isModalVisible}
        onClose={hideFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        initialType={initialType}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Global feedback methods for use without hooks
let globalFeedbackRef = null;

export const setGlobalFeedbackRef = (ref) => {
  globalFeedbackRef = ref;
};

export const feedback = {
  reportBug: () => {
    if (globalFeedbackRef) {
      globalFeedbackRef.reportBug();
    } else {
      console.warn('Feedback not initialized. Wrap your app with FeedbackProvider.');
    }
  },
  requestFeature: () => {
    if (globalFeedbackRef) {
      globalFeedbackRef.requestFeature();
    } else {
      console.warn('Feedback not initialized. Wrap your app with FeedbackProvider.');
    }
  },
  suggestImprovement: () => {
    if (globalFeedbackRef) {
      globalFeedbackRef.suggestImprovement();
    } else {
      console.warn('Feedback not initialized. Wrap your app with FeedbackProvider.');
    }
  },
  giveFeedback: () => {
    if (globalFeedbackRef) {
      globalFeedbackRef.giveFeedback();
    } else {
      console.warn('Feedback not initialized. Wrap your app with FeedbackProvider.');
    }
  },
};

// Enhanced FeedbackProvider that sets global reference
export const EnhancedFeedbackProvider = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialType, setInitialType] = useState('general');
  const { showSuccess, showError } = useToastContext();

  const contextValue = {
    showFeedbackModal: (type = 'general') => {
      setInitialType(type);
      setIsModalVisible(true);
    },
    hideFeedbackModal: () => setIsModalVisible(false),
    reportBug: () => {
      setInitialType('bug');
      setIsModalVisible(true);
    },
    requestFeature: () => {
      setInitialType('feature');
      setIsModalVisible(true);
    },
    suggestImprovement: () => {
      setInitialType('improvement');
      setIsModalVisible(true);
    },
    giveFeedback: () => {
      setInitialType('general');
      setIsModalVisible(true);
    },
    isModalVisible,
  };

  React.useEffect(() => {
    setGlobalFeedbackRef(contextValue);
    return () => setGlobalFeedbackRef(null);
  }, [contextValue]);

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      console.log('Feedback submitted:', feedbackData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Geri bildiriminiz başarıyla gönderildi. Teşekkürler!', {
        duration: 5000,
        title: 'Başarılı'
      });

      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      showError('Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', {
        duration: 6000,
        title: 'Hata'
      });
      throw error;
    }
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackModal
        visible={isModalVisible}
        onClose={contextValue.hideFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        initialType={initialType}
      />
    </FeedbackContext.Provider>
  );
};

