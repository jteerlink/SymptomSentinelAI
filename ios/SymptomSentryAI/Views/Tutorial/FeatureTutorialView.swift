import SwiftUI

struct FeatureTutorialView: View {
    let feature: FeatureTutorial
    @State private var currentStep = 0
    @State private var showingTutorial = true
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            // Background to capture taps
            Color.black.opacity(0.75)
                .edgesIgnoringSafeArea(.all)
                .onTapGesture {
                    nextStep()
                }
            
            // Tutorial content
            if currentStep < feature.steps.count {
                let step = feature.steps[currentStep]
                
                VStack(spacing: 20) {
                    // Step indicator
                    if feature.steps.count > 1 {
                        HStack(spacing: 8) {
                            ForEach(0..<feature.steps.count, id: \.self) { index in
                                Circle()
                                    .fill(index == currentStep ? Color.white : Color.gray.opacity(0.5))
                                    .frame(width: 8, height: 8)
                            }
                        }
                        .padding(.top)
                    }
                    
                    // Title and icon
                    HStack {
                        if !step.imageName.isEmpty {
                            Image(systemName: step.imageName)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 30, height: 30)
                                .foregroundColor(.white)
                        }
                        
                        Text(step.title)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    .padding(.top, feature.steps.count > 1 ? 0 : 16)
                    
                    // Description
                    Text(step.description)
                        .font(.body)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Image if provided
                    if let imageName = step.screenshotName {
                        Image(imageName)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .cornerRadius(8)
                            .padding(.horizontal)
                            .frame(maxHeight: 200)
                    }
                    
                    // Navigation buttons
                    HStack {
                        // Previous button (if not first step)
                        if currentStep > 0 {
                            Button(action: previousStep) {
                                HStack {
                                    Image(systemName: "chevron.left")
                                    Text("Previous")
                                }
                                .foregroundColor(.white)
                                .padding(.vertical, 8)
                                .padding(.horizontal, 16)
                                .background(Color.gray.opacity(0.3))
                                .cornerRadius(8)
                            }
                        }
                        
                        Spacer()
                        
                        // Next/Done button
                        Button(action: nextStep) {
                            if currentStep == feature.steps.count - 1 {
                                Text("Got it!")
                                    .fontWeight(.semibold)
                            } else {
                                HStack {
                                    Text("Next")
                                    Image(systemName: "chevron.right")
                                }
                            }
                        }
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background(Color.blue)
                        .cornerRadius(8)
                    }
                    .padding(.bottom)
                }
                .padding()
                .background(Color(UIColor.systemBackground).opacity(0.2))
                .cornerRadius(16)
                .shadow(radius: 5)
                .padding(.horizontal, 20)
                .transition(AnyTransition.opacity.combined(with: .scale))
                .animation(.easeInOut)
            }
        }
        .onDisappear {
            // Save tutorial completion status
            FeatureTutorialManager.shared.markTutorialAsCompleted(feature.id)
        }
    }
    
    private func nextStep() {
        if currentStep < feature.steps.count - 1 {
            currentStep += 1
        } else {
            presentationMode.wrappedValue.dismiss()
        }
    }
    
    private func previousStep() {
        if currentStep > 0 {
            currentStep -= 1
        }
    }
}

// MARK: - Feature Tutorial Models

struct FeatureTutorial: Identifiable {
    let id: String
    let title: String
    let steps: [TutorialStepInfo]
}

struct TutorialStepInfo: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let imageName: String
    let screenshotName: String?
}

// MARK: - Feature Tutorial Manager

class FeatureTutorialManager {
    static let shared = FeatureTutorialManager()
    
    private let completedTutorialsKey = "CompletedFeatureTutorials"
    
    private init() {}
    
    // Check if a tutorial has been completed
    func isTutorialCompleted(_ tutorialId: String) -> Bool {
        let completedTutorials = UserDefaults.standard.stringArray(forKey: completedTutorialsKey) ?? []
        return completedTutorials.contains(tutorialId)
    }
    
    // Mark a tutorial as completed
    func markTutorialAsCompleted(_ tutorialId: String) {
        var completedTutorials = UserDefaults.standard.stringArray(forKey: completedTutorialsKey) ?? []
        
        if !completedTutorials.contains(tutorialId) {
            completedTutorials.append(tutorialId)
            UserDefaults.standard.set(completedTutorials, forKey: completedTutorialsKey)
        }
    }
    
    // Reset a specific tutorial
    func resetTutorial(_ tutorialId: String) {
        var completedTutorials = UserDefaults.standard.stringArray(forKey: completedTutorialsKey) ?? []
        
        if let index = completedTutorials.firstIndex(of: tutorialId) {
            completedTutorials.remove(at: index)
            UserDefaults.standard.set(completedTutorials, forKey: completedTutorialsKey)
        }
    }
    
    // Reset all tutorials
    func resetAllTutorials() {
        UserDefaults.standard.removeObject(forKey: completedTutorialsKey)
    }
    
    // Pre-defined feature tutorials
    
    // Analysis tutorial
    static let analysisTutorial = FeatureTutorial(
        id: "analysis_tutorial",
        title: "How to Analyze Images",
        steps: [
            TutorialStepInfo(
                title: "Choose Analysis Type",
                description: "First, select whether you want to analyze a throat or ear image.",
                imageName: "1.circle",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Capture an Image",
                description: "Take a clear, well-lit photo, or select one from your photos.",
                imageName: "2.circle",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Review Results",
                description: "The AI will analyze your image and provide potential conditions with confidence scores.",
                imageName: "3.circle",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Save and Track",
                description: "Results are automatically saved to your history for future reference.",
                imageName: "4.circle",
                screenshotName: nil
            )
        ]
    )
    
    // Educational content tutorial
    static let educationTutorial = FeatureTutorial(
        id: "education_tutorial",
        title: "Using Educational Resources",
        steps: [
            TutorialStepInfo(
                title: "Browse by Category",
                description: "Filter articles by conditions, treatments, or prevention topics.",
                imageName: "folder",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Premium Content",
                description: "Premium subscribers have access to our entire educational library, indicated by star icons.",
                imageName: "star.fill",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Save for Later",
                description: "Bookmark important articles to read later, even offline.",
                imageName: "bookmark.fill",
                screenshotName: nil
            )
        ]
    )
    
    // Subscription tutorial
    static let subscriptionTutorial = FeatureTutorial(
        id: "subscription_tutorial",
        title: "Premium Subscription Benefits",
        steps: [
            TutorialStepInfo(
                title: "Unlimited Analyses",
                description: "Free users are limited to 2 analyses per month, while Premium users enjoy unlimited analyses.",
                imageName: "infinity",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Full Educational Library",
                description: "Access our comprehensive collection of medical articles and resources.",
                imageName: "book.fill",
                screenshotName: nil
            ),
            TutorialStepInfo(
                title: "Premium Support",
                description: "Get priority customer support and faster response times.",
                imageName: "person.fill.checkmark",
                screenshotName: nil
            )
        ]
    )
}

// MARK: - Preview

struct FeatureTutorialView_Previews: PreviewProvider {
    static var previews: some View {
        FeatureTutorialView(feature: FeatureTutorialManager.analysisTutorial)
    }
}