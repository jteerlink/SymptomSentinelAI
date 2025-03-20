import Foundation
import SwiftUI
import Combine

/// Service for managing tutorials and onboarding
class TutorialService: ObservableObject {
    // MARK: - Shared Instance
    
    /// Shared instance for singleton access
    static let shared = TutorialService()
    
    // MARK: - Published Properties
    
    /// Whether onboarding should be shown
    @Published var shouldShowOnboarding: Bool = false
    
    /// Currently shown feature tutorial
    @Published var currentFeatureTutorial: String? = nil
    
    /// Whether tutorial overlay is visible
    @Published var isTutorialOverlayVisible: Bool = false
    
    /// Position to highlight in the tutorial overlay
    @Published var highlightPosition: CGRect = .zero
    
    /// Currently displayed tutorial step
    @Published var currentTutorialStep: Int = 0
    
    /// Feature tutorial steps
    @Published var featureTutorialSteps: [TutorialStep] = []
    
    // MARK: - Private Properties
    
    /// UserDefaults keys
    private enum UserDefaultsKeys {
        static let hasCompletedOnboarding = "hasCompletedOnboarding"
        static let hasSeenFeatureTutorials = "hasSeenFeatureTutorials"
    }
    
    // MARK: - Initialization
    
    /// Private initializer for singleton pattern
    private init() {
        // Check if onboarding should be shown
        checkOnboardingStatus()
    }
    
    // MARK: - Public Methods
    
    /// Check if onboarding should be shown
    func checkOnboardingStatus() {
        let hasCompletedOnboarding = UserDefaults.standard.bool(forKey: UserDefaultsKeys.hasCompletedOnboarding)
        shouldShowOnboarding = !hasCompletedOnboarding
    }
    
    /// Start onboarding flow
    func startOnboarding() {
        shouldShowOnboarding = true
    }
    
    /// Complete onboarding flow
    func completeOnboarding() {
        shouldShowOnboarding = false
        UserDefaults.standard.set(true, forKey: UserDefaultsKeys.hasCompletedOnboarding)
    }
    
    /// Skip onboarding flow
    func skipOnboarding() {
        shouldShowOnboarding = false
        UserDefaults.standard.set(true, forKey: UserDefaultsKeys.hasCompletedOnboarding)
    }
    
    /// Start feature-specific tutorial
    func startFeatureTutorial(featureId: String) {
        // Set up appropriate tutorial steps based on feature ID
        setupTutorialSteps(for: featureId)
        
        currentFeatureTutorial = featureId
        currentTutorialStep = 0
        isTutorialOverlayVisible = true
    }
    
    /// Advance to next tutorial step
    func nextTutorialStep() {
        if currentTutorialStep < featureTutorialSteps.count - 1 {
            currentTutorialStep += 1
        } else {
            completeTutorial()
        }
    }
    
    /// Go back to previous tutorial step
    func previousTutorialStep() {
        if currentTutorialStep > 0 {
            currentTutorialStep -= 1
        }
    }
    
    /// Complete current tutorial
    func completeTutorial() {
        currentFeatureTutorial = nil
        isTutorialOverlayVisible = false
        featureTutorialSteps = []
        currentTutorialStep = 0
    }
    
    /// Skip current tutorial
    func skipTutorial() {
        completeTutorial()
    }
    
    /// Reset all tutorials
    func resetTutorials() {
        UserDefaults.standard.set(false, forKey: UserDefaultsKeys.hasCompletedOnboarding)
        UserDefaults.standard.set(false, forKey: UserDefaultsKeys.hasSeenFeatureTutorials)
        
        // Reset feature-specific flags
        UserDefaults.standard.set(false, forKey: "hasSeenAnalysisTutorial")
        UserDefaults.standard.set(false, forKey: "hasSeenImageUploadTutorial")
        UserDefaults.standard.set(false, forKey: "hasSeenTelemedicineTutorial")
        
        checkOnboardingStatus()
    }
    
    /// Update highlight position for current tutorial step
    func updateHighlightPosition(_ position: CGRect) {
        highlightPosition = position
    }
    
    // MARK: - Private Methods
    
    /// Set up tutorial steps for a specific feature
    private func setupTutorialSteps(for featureId: String) {
        switch featureId {
        case "analysis":
            featureTutorialSteps = [
                TutorialStep(
                    id: "analysis_1",
                    title: "Analysis Features",
                    description: "Learn how to analyze medical images and understand the results.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "analysis_2",
                    title: "Upload an Image",
                    description: "Start by uploading an image of your throat or ear using the camera or photo library.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "analysis_3",
                    title: "Review Results",
                    description: "Our AI will analyze the image and suggest possible conditions with confidence scores.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "analysis_4",
                    title: "Consult with Professionals",
                    description: "Remember that this is not a diagnosis. Always consult with healthcare professionals.",
                    highlightFrame: .zero
                )
            ]
            
        case "education":
            featureTutorialSteps = [
                TutorialStep(
                    id: "education_1",
                    title: "Educational Content",
                    description: "Browse our library of educational content about throat and ear conditions.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "education_2",
                    title: "Filter Content",
                    description: "Use category filters to find specific information about conditions that interest you.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "education_3",
                    title: "Save for Later",
                    description: "Bookmark articles and videos to create your personal library of useful resources.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "education_4",
                    title: "Search Feature",
                    description: "Use the search bar to quickly find content about specific symptoms or conditions.",
                    highlightFrame: .zero
                )
            ]
            
        case "imageUpload":
            featureTutorialSteps = [
                TutorialStep(
                    id: "imageUpload_1",
                    title: "Image Upload",
                    description: "Learn how to capture and upload medical images for analysis.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "imageUpload_2",
                    title: "Image Quality",
                    description: "Make sure to take clear, well-lit images for the best analysis results.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "imageUpload_3",
                    title: "Privacy Protection",
                    description: "Your images are encrypted and handled according to HIPAA guidelines.",
                    highlightFrame: .zero
                )
            ]
            
        case "telemedicine":
            featureTutorialSteps = [
                TutorialStep(
                    id: "telemedicine_1",
                    title: "Telemedicine Services",
                    description: "Connect with healthcare professionals remotely for consultations.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "telemedicine_2",
                    title: "Schedule Appointments",
                    description: "Book video or audio consultations at your convenience.",
                    highlightFrame: .zero
                ),
                TutorialStep(
                    id: "telemedicine_3",
                    title: "Share Analysis Results",
                    description: "Easily share your AI analysis results with your healthcare provider.",
                    highlightFrame: .zero
                )
            ]
            
        default:
            featureTutorialSteps = []
        }
    }
}

/// Tutorial step model
struct TutorialStep: Identifiable {
    /// Unique identifier for the step
    let id: String
    
    /// Step title
    let title: String
    
    /// Step description
    let description: String
    
    /// Frame to highlight in the UI
    var highlightFrame: CGRect
}