import SwiftUI

// MARK: - Tutorial Step

struct TutorialStep {
    let title: String
    let description: String
    let imageName: String
    let alignment: Alignment
    let highlightFrame: CGRect?
    let highlightTab: TabSelection?
    let additionalContent: AnyView
    
    struct TabSelection {
        let name: String
        let index: Int
    }
    
    init(
        title: String,
        description: String,
        imageName: String,
        alignment: Alignment = .center,
        highlightFrame: CGRect? = nil,
        highlightTab: TabSelection? = nil,
        additionalContent: AnyView = AnyView(EmptyView())
    ) {
        self.title = title
        self.description = description
        self.imageName = imageName
        self.alignment = alignment
        self.highlightFrame = highlightFrame
        self.highlightTab = highlightTab
        self.additionalContent = additionalContent
    }
}

// MARK: - Tutorial Service

class TutorialService: ObservableObject {
    static let shared = TutorialService()
    
    // Published properties
    @Published var isShowingTutorial = false
    @Published var currentStep = 0
    @Published var tutorialCompleted = false
    
    // Keys for UserDefaults
    private let tutorialCompletedKey = "SymptomSentryTutorialCompleted"
    private let firstLaunchKey = "SymptomSentryFirstLaunch"
    
    // Tutorial steps
    let tutorialSteps: [TutorialStep] = [
        // Welcome step
        TutorialStep(
            title: "Welcome to SymptomSentry AI",
            description: "Your personal healthcare assistant for throat and ear conditions. Let's take a quick tour of the app!",
            imageName: "stethoscope",
            alignment: .center,
            additionalContent: AnyView(
                Image(systemName: "hand.wave")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 40, height: 40)
                    .foregroundColor(.yellow)
                    .padding(.bottom, 10)
            )
        ),
        
        // Home tab
        TutorialStep(
            title: "Home",
            description: "Get a quick overview of your health stats, recent activities, and helpful tips.",
            imageName: "house.fill",
            alignment: .center,
            highlightTab: TutorialStep.TabSelection(name: "Home", index: 0)
        ),
        
        // Analysis tab
        TutorialStep(
            title: "Analysis",
            description: "Take or upload photos of throat or ear symptoms for AI-powered analysis.",
            imageName: "camera.fill",
            alignment: .center,
            highlightTab: TutorialStep.TabSelection(name: "Analysis", index: 1)
        ),
        
        // Learn tab
        TutorialStep(
            title: "Learn",
            description: "Access educational content about common conditions, treatments, and prevention.",
            imageName: "book.fill",
            alignment: .center,
            highlightTab: TutorialStep.TabSelection(name: "Learn", index: 2)
        ),
        
        // Premium tab
        TutorialStep(
            title: "Premium",
            description: "Upgrade to unlock unlimited analyses, premium content, and expert support.",
            imageName: "star.fill",
            alignment: .center,
            highlightTab: TutorialStep.TabSelection(name: "Premium", index: 3)
        ),
        
        // Profile tab
        TutorialStep(
            title: "Profile",
            description: "Manage your account, view your analysis history, and customize settings.",
            imageName: "person.fill",
            alignment: .center,
            highlightTab: TutorialStep.TabSelection(name: "Profile", index: 4)
        ),
        
        // Final step
        TutorialStep(
            title: "You're All Set!",
            description: "Remember, this app provides educational insights, not medical diagnoses. Always consult a healthcare professional for medical advice.",
            imageName: "checkmark.circle.fill",
            alignment: .center,
            additionalContent: AnyView(
                VStack {
                    Image(systemName: "heart.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 40, height: 40)
                        .foregroundColor(.red)
                        .padding(.bottom, 10)
                    
                    Text("Stay healthy!")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            )
        )
    ]
    
    private init() {
        // Check if it's the first launch
        if !UserDefaults.standard.bool(forKey: firstLaunchKey) {
            UserDefaults.standard.set(true, forKey: firstLaunchKey)
            // Only show tutorial automatically on first launch
            isShowingTutorial = true
        } else {
            // Check if tutorial was completed before
            tutorialCompleted = UserDefaults.standard.bool(forKey: tutorialCompletedKey)
        }
    }
    
    // MARK: - Tutorial Navigation
    
    func startTutorial() {
        currentStep = 0
        isShowingTutorial = true
    }
    
    func nextStep() {
        if currentStep < tutorialSteps.count - 1 {
            currentStep += 1
        } else {
            completeTutorial()
        }
    }
    
    func previousStep() {
        if currentStep > 0 {
            currentStep -= 1
        }
    }
    
    func skipTutorial() {
        completeTutorial()
    }
    
    func completeTutorial() {
        isShowingTutorial = false
        tutorialCompleted = true
        UserDefaults.standard.set(true, forKey: tutorialCompletedKey)
    }
    
    func resetTutorial() {
        UserDefaults.standard.set(false, forKey: tutorialCompletedKey)
        tutorialCompleted = false
    }
}

// MARK: - Helper Extensions

extension View {
    func measureSize(perform action: @escaping (CGSize) -> Void) -> some View {
        self.background(
            GeometryReader { geometry in
                Color.clear
                    .preference(key: SizePreferenceKey.self, value: geometry.size)
            }
        )
        .onPreferenceChange(SizePreferenceKey.self, perform: action)
    }
}

struct SizePreferenceKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}