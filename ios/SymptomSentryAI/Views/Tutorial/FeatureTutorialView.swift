import SwiftUI

/// Feature tutorial overlay that can be displayed on top of app screens
struct FeatureTutorialView: View {
    // MARK: - Environment & State
    
    /// Tutorial service for state management
    @ObservedObject private var tutorialService = TutorialService.shared
    
    /// The feature ID this tutorial is for
    let featureId: String
    
    /// The steps in this tutorial
    let steps: [TutorialStep]
    
    /// Current step in the tutorial
    @State private var currentStepIndex = 0
    
    /// Animation states
    @State private var isShowingOverlay = false
    @State private var isAnimating = false
    
    /// Dismissal handling
    var onComplete: () -> Void
    
    // MARK: - Initializer
    
    init(featureId: String, steps: [TutorialStep], onComplete: @escaping () -> Void = {}) {
        self.featureId = featureId
        self.steps = steps
        self.onComplete = onComplete
    }
    
    // MARK: - Body
    
    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.75)
                .ignoresSafeArea()
                .opacity(isShowingOverlay ? 1 : 0)
                .animation(.easeInOut(duration: 0.3), value: isShowingOverlay)
            
            // Tutorial content
            if !steps.isEmpty {
                currentStep.makeView(
                    isAnimating: isAnimating,
                    onNext: advanceToNextStep,
                    onSkip: completeTutorial
                )
                .padding(24)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(radius: 10)
                )
                .padding(.horizontal, 24)
                .opacity(isShowingOverlay ? 1 : 0)
                .scaleEffect(isShowingOverlay ? 1 : 0.9)
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isShowingOverlay)
            }
        }
        .onAppear {
            // Start with a brief delay to ensure the underlying view is ready
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                isShowingOverlay = true
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    withAnimation {
                        isAnimating = true
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("FeatureTutorial-\(featureId)")
    }
    
    // MARK: - Computed Properties
    
    /// Get the current tutorial step
    private var currentStep: TutorialStep {
        guard currentStepIndex < steps.count else {
            return steps.first ?? TutorialStep.placeholder
        }
        return steps[currentStepIndex]
    }
    
    // MARK: - Methods
    
    /// Advance to the next step in the tutorial
    private func advanceToNextStep() {
        withAnimation {
            isAnimating = false
        }
        
        let nextIndex = currentStepIndex + 1
        
        if nextIndex < steps.count {
            // Move to next step
            withAnimation {
                currentStepIndex = nextIndex
            }
            
            // Restart animations for the new step
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation {
                    isAnimating = true
                }
            }
        } else {
            // We've reached the end of the tutorial
            completeTutorial()
        }
    }
    
    /// Complete the tutorial and dismiss
    private func completeTutorial() {
        withAnimation(.easeOut(duration: 0.3)) {
            isShowingOverlay = false
            isAnimating = false
        }
        
        // Give time for animation to finish before actually dismissing
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onComplete()
        }
    }
}

/// Model representing a single step in a feature tutorial
struct TutorialStep {
    /// Unique identifier for the step
    let id: String
    
    /// Title of the step
    let title: String
    
    /// Description text
    let description: String
    
    /// Optional image name
    let imageName: String?
    
    /// Optional reference to a UI element to highlight
    let highlightElementId: String?
    
    /// Placeholder step used as a fallback
    static let placeholder = TutorialStep(
        id: "placeholder",
        title: "Tutorial",
        description: "This is a placeholder tutorial step.",
        imageName: nil,
        highlightElementId: nil
    )
    
    /// Create the view for this tutorial step
    /// - Parameters:
    ///   - isAnimating: Whether animations should be playing
    ///   - onNext: Action to perform when advancing to the next step
    ///   - onSkip: Action to perform when skipping the tutorial
    /// - Returns: A view representing this tutorial step
    func makeView(isAnimating: Bool, onNext: @escaping () -> Void, onSkip: @escaping () -> Void) -> some View {
        VStack(spacing: 24) {
            // Title and description
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .offset(y: isAnimating ? 0 : -10)
                    .opacity(isAnimating ? 1 : 0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.8).delay(0.1), value: isAnimating)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .offset(y: isAnimating ? 0 : 10)
                    .opacity(isAnimating ? 1 : 0)
                    .animation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.2), value: isAnimating)
            }
            
            // Image if provided
            if let imageName = imageName {
                Image(systemName: imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 100)
                    .foregroundColor(.blue)
                    .padding(.vertical, 8)
                    .scaleEffect(isAnimating ? 1 : 0.8)
                    .opacity(isAnimating ? 1 : 0)
                    .animation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.3), value: isAnimating)
            }
            
            // Action buttons
            HStack {
                Button("Skip") {
                    onSkip()
                }
                .foregroundColor(.gray)
                .accessibilityIdentifier("SkipTutorialButton")
                
                Spacer()
                
                Button(action: onNext) {
                    Text("Next")
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Capsule().fill(Color.blue))
                }
                .accessibilityIdentifier("NextTutorialStepButton")
            }
            .offset(y: isAnimating ? 0 : 20)
            .opacity(isAnimating ? 1 : 0)
            .animation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.4), value: isAnimating)
        }
        .padding(20)
    }
}

// MARK: - Previews

struct FeatureTutorialView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray.opacity(0.3).ignoresSafeArea()
            
            FeatureTutorialView(
                featureId: "imageUpload",
                steps: [
                    TutorialStep(
                        id: "step1",
                        title: "Upload an Image",
                        description: "Take a clear photo of your throat or ear. Make sure you have good lighting for best results.",
                        imageName: "camera.fill",
                        highlightElementId: "uploadButton"
                    ),
                    TutorialStep(
                        id: "step2",
                        title: "Analyze Results",
                        description: "Our AI will analyze your image and provide potential diagnoses with confidence levels.",
                        imageName: "waveform.path.ecg",
                        highlightElementId: "analyzeButton"
                    )
                ]
            )
        }
    }
}