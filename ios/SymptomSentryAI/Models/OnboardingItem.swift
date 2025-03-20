import Foundation
import SwiftUI

/// Onboarding item for tutorial slides
struct OnboardingItem: Identifiable {
    /// Unique identifier
    let id: String
    
    /// Title of the onboarding slide
    let title: String
    
    /// Description text
    let description: String
    
    /// Image name from asset catalog
    let imageName: String
    
    /// Background color
    let backgroundColor: Color
    
    /// Text color
    let textColor: Color
    
    /// Whether this slide has an interactive element
    let hasInteractiveElement: Bool
    
    /// Type of interactive element
    let interactiveElementType: InteractiveElementType?
    
    /// Creates a new onboarding item
    init(
        id: String = UUID().uuidString,
        title: String,
        description: String,
        imageName: String,
        backgroundColor: Color = .blue,
        textColor: Color = .white,
        hasInteractiveElement: Bool = false,
        interactiveElementType: InteractiveElementType? = nil
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.imageName = imageName
        self.backgroundColor = backgroundColor
        self.textColor = textColor
        self.hasInteractiveElement = hasInteractiveElement
        self.interactiveElementType = interactiveElementType
    }
    
    /// Types of interactive elements in onboarding
    enum InteractiveElementType {
        case cameraDemo
        case analysisDemo
        case subscriptionDemo
    }
    
    /// Get standard onboarding items
    static func getOnboardingItems() -> [OnboardingItem] {
        return [
            OnboardingItem(
                id: "welcome",
                title: "Welcome to SymptomSentryAI",
                description: "Your personal health assistant powered by artificial intelligence.",
                imageName: "onboarding_welcome",
                backgroundColor: Color.blue,
                textColor: .white
            ),
            OnboardingItem(
                id: "image_analysis",
                title: "Image Analysis",
                description: "Upload photos of your throat or ear and get instant AI-powered analysis to identify potential conditions.",
                imageName: "onboarding_analysis",
                backgroundColor: Color.purple,
                textColor: .white,
                hasInteractiveElement: true,
                interactiveElementType: .cameraDemo
            ),
            OnboardingItem(
                id: "educational_content",
                title: "Educational Content",
                description: "Access a comprehensive library of medical information about common throat and ear conditions.",
                imageName: "onboarding_education",
                backgroundColor: Color.green,
                textColor: .white
            ),
            OnboardingItem(
                id: "telemedicine",
                title: "Telemedicine Connection",
                description: "Connect with healthcare professionals through secure video consultations when you need expert advice.",
                imageName: "onboarding_telemedicine",
                backgroundColor: Color.orange,
                textColor: .white
            ),
            OnboardingItem(
                id: "privacy",
                title: "Privacy & Security",
                description: "Your health data is protected with industry-leading encryption and HIPAA-compliant storage.",
                imageName: "onboarding_privacy",
                backgroundColor: Color.red,
                textColor: .white
            ),
            OnboardingItem(
                id: "subscription",
                title: "Choose Your Plan",
                description: "Start with our free plan or unlock premium features with a subscription.",
                imageName: "onboarding_subscription",
                backgroundColor: Color.blue,
                textColor: .white,
                hasInteractiveElement: true,
                interactiveElementType: .subscriptionDemo
            )
        ]
    }
}