import SwiftUI

/// Main onboarding view with swipeable slides
struct OnboardingView: View {
    // MARK: - Environment & State
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    /// Current page index
    @State private var currentPage = 0
    
    /// Onboarding items to display
    @State private var onboardingItems = OnboardingItem.getOnboardingItems()
    
    // MARK: - Body
    
    var body: some View {
        ZStack {
            // Background color based on current page
            onboardingItems[currentPage].backgroundColor
                .ignoresSafeArea()
            
            VStack {
                // Skip button at top
                HStack {
                    Spacer()
                    
                    Button(action: skipTapped) {
                        Text("Skip")
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .stroke(Color.white, lineWidth: 1)
                            )
                    }
                    .padding()
                    .accessibilityIdentifier("skipButton")
                }
                
                // Tab view for swipeable slides
                TabView(selection: $currentPage) {
                    ForEach(0..<onboardingItems.count, id: \.self) { index in
                        OnboardingPageView(
                            item: onboardingItems[index],
                            isLastPage: index == onboardingItems.count - 1
                        )
                        .tag(index)
                    }
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .automatic))
                .indexViewStyle(PageIndexViewStyle(backgroundDisplayMode: .always))
                
                // Next/Get Started button at bottom
                Button(action: nextTapped) {
                    Text(currentPage == onboardingItems.count - 1 ? "Get Started" : "Next")
                        .fontWeight(.medium)
                        .foregroundColor(onboardingItems[currentPage].backgroundColor)
                        .frame(width: 200)
                        .padding()
                        .background(
                            Capsule()
                                .fill(Color.white)
                        )
                }
                .accessibilityIdentifier(currentPage == onboardingItems.count - 1 ? "getStartedButton" : "nextButton")
                .padding(.bottom, 50)
            }
        }
        .onAppear {
            // Mark onboarding as seen when view appears
            UserDefaults.standard.set(true, forKey: "hasSeenOnboarding")
        }
    }
    
    // MARK: - Action Methods
    
    /// Handle skip button tap
    private func skipTapped() {
        tutorialService.skipOnboarding()
    }
    
    /// Handle next button tap
    private func nextTapped() {
        if currentPage < onboardingItems.count - 1 {
            withAnimation {
                currentPage += 1
            }
        } else {
            tutorialService.completeOnboarding()
        }
    }
}

/// Individual onboarding page view
struct OnboardingPageView: View {
    // MARK: - Properties
    
    /// Onboarding item to display
    let item: OnboardingItem
    
    /// Whether this is the last page
    let isLastPage: Bool
    
    // MARK: - Body
    
    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            
            // Image
            ImagePlaceholder(imageName: item.imageName)
                .frame(width: 220, height: 220)
                .padding(.bottom, 20)
            
            // Title
            Text(item.title)
                .font(.system(size: 30, weight: .bold))
                .foregroundColor(item.textColor)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Description
            Text(item.description)
                .font(.system(size: 17))
                .foregroundColor(item.textColor.opacity(0.8))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
                .padding(.bottom, 20)
            
            // Interactive element if available
            if item.hasInteractiveElement {
                InteractiveElement(type: item.interactiveElementType!)
                    .frame(height: 120)
                    .padding(.horizontal)
            }
            
            Spacer()
        }
        .accessibilityIdentifier("onboardingPage\(item.id)")
    }
}

/// Placeholder for images
struct ImagePlaceholder: View {
    let imageName: String
    
    var body: some View {
        // In a real app, use actual images
        // For this demo, we'll use system images as placeholders
        ZStack {
            Circle()
                .fill(Color.white.opacity(0.2))
            
            // Determine appropriate system image based on image name
            Image(systemName: systemImageName)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .padding(40)
                .foregroundColor(.white)
        }
    }
    
    /// Convert image name to system image name
    private var systemImageName: String {
        switch imageName {
        case "onboarding_welcome":
            return "hand.wave"
        case "onboarding_analysis":
            return "waveform.path.ecg"
        case "onboarding_education":
            return "book.fill"
        case "onboarding_telemedicine":
            return "video.fill"
        case "onboarding_privacy":
            return "lock.shield"
        case "onboarding_subscription":
            return "star.fill"
        default:
            return "questionmark"
        }
    }
}

/// Interactive element for onboarding
struct InteractiveElement: View {
    let type: OnboardingItem.InteractiveElementType
    
    var body: some View {
        switch type {
        case .cameraDemo:
            CameraDemoView()
        case .analysisDemo:
            AnalysisDemoView()
        case .subscriptionDemo:
            SubscriptionDemoView()
        }
    }
}

/// Camera demo for onboarding
struct CameraDemoView: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 10) {
            Text("Try Our Camera")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack(spacing: 30) {
                Button(action: {
                    // Simulated camera action
                    withAnimation(Animation.easeInOut(duration: 0.5)) {
                        isAnimating = true
                        
                        // Reset after animation
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            isAnimating = false
                        }
                    }
                }) {
                    Image(systemName: "camera.viewfinder")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .padding()
                        .background(Circle().fill(Color.white))
                        .foregroundColor(.blue)
                        .scaleEffect(isAnimating ? 1.2 : 1.0)
                }
                
                Button(action: {
                    // Simulated photo selection action
                    withAnimation(Animation.easeInOut(duration: 0.5)) {
                        isAnimating = true
                        
                        // Reset after animation
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            isAnimating = false
                        }
                    }
                }) {
                    Image(systemName: "photo.on.rectangle")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .padding()
                        .background(Circle().fill(Color.white))
                        .foregroundColor(.green)
                        .scaleEffect(isAnimating ? 1.2 : 1.0)
                }
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.2)))
    }
}

/// Analysis demo for onboarding
struct AnalysisDemoView: View {
    @State private var isAnalyzing = false
    @State private var progress: CGFloat = 0.0
    
    var body: some View {
        VStack(spacing: 10) {
            Text("AI-Powered Analysis")
                .font(.headline)
                .foregroundColor(.white)
            
            if isAnalyzing {
                VStack {
                    ProgressView(value: progress, total: 1.0)
                        .progressViewStyle(LinearProgressViewStyle(tint: .white))
                        .frame(width: 200)
                    
                    Text("\(Int(progress * 100))%")
                        .foregroundColor(.white)
                        .font(.caption)
                }
            } else {
                Button(action: {
                    // Start simulated analysis
                    isAnalyzing = true
                    progress = 0.0
                    
                    // Animate progress
                    withAnimation(Animation.easeInOut(duration: 2.0)) {
                        progress = 1.0
                    }
                    
                    // Reset after animation
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        isAnalyzing = false
                    }
                }) {
                    Text("Start Demo Analysis")
                        .foregroundColor(.purple)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(Color.white))
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.2)))
    }
}

/// Subscription demo for onboarding
struct SubscriptionDemoView: View {
    var body: some View {
        VStack(spacing: 10) {
            Text("Subscription Options")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack(spacing: 20) {
                // Free plan
                VStack {
                    Text("Free")
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    Text("Basic features")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding()
                .frame(width: 100)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.2)))
                
                // Premium plan
                VStack {
                    Text("Premium")
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    Text("All features")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding()
                .frame(width: 100)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.yellow.opacity(0.3)))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.yellow, lineWidth: 2)
                )
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.2)))
    }
}

// MARK: - Preview
struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView()
    }
}