import SwiftUI

/// Overlay view that highlights UI elements during feature tutorials
struct TutorialOverlayView: View {
    // MARK: - Environment & State
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    /// Whether to show hint arrow
    @State private var showArrow = false
    
    // MARK: - Body
    
    var body: some View {
        ZStack {
            // Semi-transparent overlay
            Color.black.opacity(0.7)
                .ignoresSafeArea()
                .allowsHitTesting(false)
            
            // This creates a hole in the overlay to highlight the selected UI element
            if tutorialService.highlightPosition != .zero {
                Rectangle()
                    .fill(Color.black.opacity(0.7))
                    .ignoresSafeArea()
                    .mask(
                        ZStack {
                            Rectangle()
                                .ignoresSafeArea()
                            
                            // Cut out a hole where the highlight should be
                            RoundedRectangle(cornerRadius: 8)
                                .frame(
                                    width: tutorialService.highlightPosition.width + 16,
                                    height: tutorialService.highlightPosition.height + 16
                                )
                                .position(
                                    x: tutorialService.highlightPosition.midX,
                                    y: tutorialService.highlightPosition.midY
                                )
                                .blendMode(.destinationOut)
                        }
                    )
                    .allowsHitTesting(false)
                
                // Pulsing outline around highlighted element
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.white, lineWidth: 3)
                    .frame(
                        width: tutorialService.highlightPosition.width + 16,
                        height: tutorialService.highlightPosition.height + 16
                    )
                    .position(
                        x: tutorialService.highlightPosition.midX,
                        y: tutorialService.highlightPosition.midY
                    )
                    .scaleEffect(showArrow ? 1.05 : 1.0)
                    .animation(Animation.easeInOut(duration: 1).repeatForever(autoreverses: true), value: showArrow)
                    .onAppear {
                        showArrow = true
                    }
            }
            
            // Tutorial information card
            if !tutorialService.featureTutorialSteps.isEmpty {
                VStack {
                    Spacer()
                    
                    // Tutorial info card
                    VStack(alignment: .leading, spacing: 12) {
                        // Tutorial title
                        Text(currentStep.title)
                            .font(.title3)
                            .fontWeight(.bold)
                        
                        Divider()
                        
                        // Tutorial description
                        Text(currentStep.description)
                            .font(.body)
                            .fixedSize(horizontal: false, vertical: true)
                        
                        Spacer(minLength: 16)
                        
                        // Navigation buttons
                        HStack {
                            // Back button
                            Button(action: {
                                tutorialService.previousTutorialStep()
                            }) {
                                Image(systemName: "arrow.left")
                                    .foregroundColor(.white)
                                    .padding(12)
                                    .background(Circle().fill(Color.gray.opacity(0.5)))
                            }
                            .disabled(tutorialService.currentTutorialStep == 0)
                            .opacity(tutorialService.currentTutorialStep == 0 ? 0.3 : 1.0)
                            
                            Spacer()
                            
                            // Progress indicator
                            HStack(spacing: 4) {
                                ForEach(0..<tutorialService.featureTutorialSteps.count, id: \.self) { index in
                                    Circle()
                                        .fill(index == tutorialService.currentTutorialStep ? Color.white : Color.gray)
                                        .frame(width: 8, height: 8)
                                }
                            }
                            
                            Spacer()
                            
                            // Next/Skip button
                            if tutorialService.currentTutorialStep < tutorialService.featureTutorialSteps.count - 1 {
                                Button(action: {
                                    tutorialService.nextTutorialStep()
                                }) {
                                    Image(systemName: "arrow.right")
                                        .foregroundColor(.white)
                                        .padding(12)
                                        .background(Circle().fill(Color.blue))
                                }
                            } else {
                                Button(action: {
                                    tutorialService.completeTutorial()
                                }) {
                                    Text("Done")
                                        .fontWeight(.medium)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(Capsule().fill(Color.blue))
                                }
                            }
                        }
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: Color.black.opacity(0.3), radius: 10, x: 0, y: 5)
                    )
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
            }
        }
        .edgesIgnoringSafeArea(.all)
    }
    
    // MARK: - Computed Properties
    
    /// Current tutorial step
    private var currentStep: TutorialStep {
        guard !tutorialService.featureTutorialSteps.isEmpty,
              tutorialService.currentTutorialStep < tutorialService.featureTutorialSteps.count else {
            return TutorialStep(id: "error", title: "Error", description: "No tutorial content available", highlightFrame: .zero)
        }
        
        return tutorialService.featureTutorialSteps[tutorialService.currentTutorialStep]
    }
}

/// Tutorial button view for interactive UI elements in tutorials
struct TutorialButtonView: View {
    // MARK: - Properties
    
    /// Button title
    let title: String
    
    /// Button action
    let action: () -> Void
    
    /// Feature ID for tutorial
    let featureId: String
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    // MARK: - Body
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: "questionmark.circle")
                Text(title)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Capsule().fill(Color.blue))
            .foregroundColor(.white)
        }
        .contentShape(Rectangle()) // Increase tap target
        .overlay(
            GeometryReader { geometry -> AnyView in
                // Capture the button's position and size
                DispatchQueue.main.async {
                    if tutorialService.currentFeatureTutorial == featureId {
                        tutorialService.updateHighlightPosition(geometry.frame(in: .global))
                    }
                }
                return AnyView(EmptyView())
            }
        )
    }
}

/// Feature tutorial view
struct FeatureTutorialView: View {
    // MARK: - Properties
    
    /// Feature ID
    let featureId: String
    
    /// Tutorial title
    let title: String
    
    /// Tutorial description
    let description: String
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    // MARK: - Body
    
    var body: some View {
        // Not shown directly - used as a container for tutorial information
        EmptyView()
            .onAppear {
                // Set up the tutorial when this view appears
                let step = TutorialStep(
                    id: featureId,
                    title: title,
                    description: description,
                    highlightFrame: .zero
                )
                
                tutorialService.featureTutorialSteps = [step]
                tutorialService.currentTutorialStep = 0
                tutorialService.currentFeatureTutorial = featureId
                tutorialService.isTutorialOverlayVisible = true
            }
            .onDisappear {
                tutorialService.completeTutorial()
            }
    }
}

// MARK: - Preview
struct TutorialOverlayView_Previews: PreviewProvider {
    static var previews: some View {
        TutorialOverlayView()
            .onAppear {
                // Set up preview data
                let tutorialService = TutorialService.shared
                tutorialService.highlightPosition = CGRect(x: 200, y: 200, width: 100, height: 50)
                tutorialService.featureTutorialSteps = [
                    TutorialStep(
                        id: "test_1",
                        title: "Welcome to the App",
                        description: "This is a test tutorial to show how the overlay works with highlighted elements.",
                        highlightFrame: CGRect(x: 200, y: 200, width: 100, height: 50)
                    ),
                    TutorialStep(
                        id: "test_2",
                        title: "Try This Feature",
                        description: "Tap on the highlighted button to see what happens next.",
                        highlightFrame: CGRect(x: 200, y: 200, width: 100, height: 50)
                    )
                ]
                tutorialService.currentTutorialStep = 0
                tutorialService.isTutorialOverlayVisible = true
            }
    }
}