import React from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageProvider';
import { SplashScreen } from './components/SplashScreen';
import { HamburgerMenu } from './components/HamburgerMenu';
import { BottomNavigation } from './components/BottomNavigation';
import { JobDetails } from './components/JobDetails';
import { NotificationCenter } from './components/NotificationCenter';
import { CommercialOfferDetails } from './components/CommercialOfferDetails';
import { HandymanProfileView } from './components/HandymanProfileView';
import { PageRouter } from './components/PageRouter';
import { TabRouter } from './components/TabRouter';
import { useAppState } from './hooks/useAppState';

function AppContent() {
  const { t } = useLanguage();
  const {
    // State
    showSplash,
    activeTab,
    selectedJob,
    selectedOffer,
    selectedCategory,
    searchQuery,
    searchFilterCategory,
    selectedHandyman,
    showNotifications,
    showHamburgerMenu,
    currentPage,
    settingsData,
    handymanProfile,
    userType,
    filteredJobs,
    filteredHandymen,
    categories,
    notifications,
    unreadCount,
    
    // Setters
    setActiveTab,
    setSelectedCategory,
    setSearchQuery,
    setSearchFilterCategory,
    setSelectedHandyman,
    setShowNotifications,
    setShowHamburgerMenu,
    setCurrentPage,
    
    // Handlers
    handleSplashComplete,
    handleJobClick,
    handleBackToList,
    handleBackToProfile,
    handleHamburgerNavigate,
    handleSaveProfile,
    handleQuickOpportunityPublish,
    handleFlashJobPublish,
    handleSubmitBid,
    handleNotificationClick,
    updateSettings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification
  } = useAppState();

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (selectedOffer) {
    return <CommercialOfferDetails offer={selectedOffer} onBack={handleBackToList} />;
  }

  if (selectedJob) {
    return <JobDetails job={selectedJob} onBack={handleBackToList} onSubmitBid={handleSubmitBid} />;
  }

  if (selectedHandyman) {
    return <HandymanProfileView handyman={selectedHandyman} onBack={() => setSelectedHandyman(null)} />;
  }

  if (showNotifications) {
    return (
      <NotificationCenter
        notifications={notifications}
        onBack={() => setShowNotifications(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRemove={removeNotification}
        onNotificationClick={handleNotificationClick}
      />
    );
  }

  // Handle page routing
  if (currentPage) {
    return (
      <PageRouter
        currentPage={currentPage}
        filteredJobs={filteredJobs}
        settingsData={settingsData}
        handymanProfile={handymanProfile}
        unreadCount={unreadCount}
        onBackToProfile={handleBackToProfile}
        onJobClick={handleJobClick}
        onSetActiveTab={setActiveTab}
        onSaveProfile={handleSaveProfile}
        onQuickOpportunityPublish={handleQuickOpportunityPublish}
        onFlashJobPublish={handleFlashJobPublish}
        onUpdateSettings={updateSettings}
        onShowHamburgerMenu={() => setShowHamburgerMenu(true)}
        onShowNotifications={() => setShowNotifications(true)}
        onPublishJob={(jobData) => {
          addNotification({
            id: Date.now().toString(),
            title: t('notifications.jobPublished'),
            message: t('notifications.jobPublishedDesc'),
            type: 'system',
            timestamp: new Date(),
            isRead: false
          });
          handleBackToProfile();
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-white relative overflow-x-hidden">
      <TabRouter
        activeTab={activeTab}
        userType={userType}
        handymanProfile={handymanProfile}
        filteredJobs={filteredJobs}
        filteredHandymen={filteredHandymen}
        categories={categories}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        searchFilterCategory={searchFilterCategory}
        unreadCount={unreadCount}
        onShowHamburgerMenu={() => setShowHamburgerMenu(true)}
        onShowNotifications={() => setShowNotifications(true)}
        onNavigateToQuickOpportunity={() => setCurrentPage('quick-opportunity')}
        onNavigateToFlashJob={() => setCurrentPage('flash-job')}
        onNavigateToCreateProfile={() => setCurrentPage('create-profile')}
        onNavigateToSearch={() => setActiveTab('search')}
        onCategorySelect={(categoryId) => setSelectedCategory(selectedCategory === categoryId ? '' : categoryId)}
        onSearchChange={setSearchQuery}
        onClearFilter={() => setSelectedCategory('')}
        onJobClick={handleJobClick}
        onSetActiveTab={setActiveTab}
        onCategoryFilterChange={setSearchFilterCategory}
        onHandymanClick={setSelectedHandyman}
        onNavigateToPage={setCurrentPage}
        onSwitchUserType={(newUserType) => {
          // Handle user type switching logic here
        }}
        onAddNotification={addNotification}
      />
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <HamburgerMenu
        isOpen={showHamburgerMenu}
        onClose={() => setShowHamburgerMenu(false)}
        onNavigate={handleHamburgerNavigate}
        unreadCount={unreadCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}