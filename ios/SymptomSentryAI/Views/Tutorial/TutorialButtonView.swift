import SwiftUI

struct TutorialButtonView: View {
    let tutorialId: String
    let feature: FeatureTutorial
    var iconOnly: Bool = false
    var color: Color = .blue
    
    @State private var showingTutorial = false
    
    var body: some View {
        Button(action: {
            showingTutorial = true
        }) {
            if iconOnly {
                Image(systemName: "questionmark.circle")
                    .foregroundColor(color)
                    .imageScale(.large)
            } else {
                HStack {
                    Image(systemName: "questionmark.circle")
                        .foregroundColor(color)
                    
                    Text("How to Use")
                        .font(.subheadline)
                        .foregroundColor(color)
                }
                .padding(.vertical, 6)
                .padding(.horizontal, 12)
                .background(color.opacity(0.1))
                .cornerRadius(16)
            }
        }
        .sheet(isPresented: $showingTutorial) {
            FeatureTutorialView(feature: feature)
        }
        .accessibilityLabel("Learn how to use this feature")
    }
}

// Convenience Views for Common Feature Tutorials

struct AnalysisTutorialButton: View {
    var iconOnly: Bool = false
    
    var body: some View {
        TutorialButtonView(
            tutorialId: "analysis_tutorial",
            feature: FeatureTutorialManager.analysisTutorial,
            iconOnly: iconOnly,
            color: .blue
        )
    }
}

struct EducationTutorialButton: View {
    var iconOnly: Bool = false
    
    var body: some View {
        TutorialButtonView(
            tutorialId: "education_tutorial",
            feature: FeatureTutorialManager.educationTutorial,
            iconOnly: iconOnly,
            color: .green
        )
    }
}

struct SubscriptionTutorialButton: View {
    var iconOnly: Bool = false
    
    var body: some View {
        TutorialButtonView(
            tutorialId: "subscription_tutorial",
            feature: FeatureTutorialManager.subscriptionTutorial,
            iconOnly: iconOnly,
            color: .yellow
        )
    }
}

// MARK: - Preview

struct TutorialButtonView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            TutorialButtonView(
                tutorialId: "analysis_tutorial",
                feature: FeatureTutorialManager.analysisTutorial,
                iconOnly: false
            )
            
            TutorialButtonView(
                tutorialId: "analysis_tutorial",
                feature: FeatureTutorialManager.analysisTutorial,
                iconOnly: true
            )
            
            AnalysisTutorialButton()
            EducationTutorialButton()
            SubscriptionTutorialButton()
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}