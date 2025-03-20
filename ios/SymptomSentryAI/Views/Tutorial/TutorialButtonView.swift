import SwiftUI

/// A reusable button component for tutorials
struct TutorialButtonView: View {
    // MARK: - Properties
    
    /// The button title
    let title: String
    
    /// The button style
    let style: ButtonStyle
    
    /// Action to perform when tapped
    let action: () -> Void
    
    /// Accessibility identifier for UI testing
    let identifier: String?
    
    /// Whether the button is disabled
    let isDisabled: Bool
    
    /// Available button styles
    enum ButtonStyle {
        case primary
        case secondary
        case tertiary
        
        /// Button background color based on style
        var backgroundColor: Color {
            switch self {
            case .primary: return .blue
            case .secondary: return Color(.systemGray5)
            case .tertiary: return .clear
            }
        }
        
        /// Button text color based on style
        var foregroundColor: Color {
            switch self {
            case .primary: return .white
            case .secondary: return .primary
            case .tertiary: return .blue
            }
        }
        
        /// Border style
        var hasBorder: Bool {
            return self == .tertiary
        }
        
        /// Font weight
        var fontWeight: Font.Weight {
            switch self {
            case .primary: return .semibold
            case .secondary: return .medium
            case .tertiary: return .regular
            }
        }
    }
    
    // MARK: - Initializer
    
    /// Initialize a tutorial button
    /// - Parameters:
    ///   - title: The button text
    ///   - style: The button visual style
    ///   - identifier: Accessibility identifier for testing
    ///   - isDisabled: Whether the button is disabled
    ///   - action: Action to perform when tapped
    init(
        title: String,
        style: ButtonStyle = .primary,
        identifier: String? = nil,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.style = style
        self.identifier = identifier
        self.isDisabled = isDisabled
        self.action = action
    }
    
    // MARK: - Body
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .fontWeight(style.fontWeight)
                .padding(.horizontal, style == .tertiary ? 8 : 20)
                .padding(.vertical, style == .tertiary ? 6 : 12)
                .frame(maxWidth: style == .primary ? .infinity : nil)
                .background(style.backgroundColor)
                .foregroundColor(style.foregroundColor)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(style.foregroundColor, lineWidth: style.hasBorder ? 1 : 0)
                )
        }
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.5 : 1.0)
        .accessibilityIdentifier(identifier ?? title.replacingOccurrences(of: " ", with: ""))
    }
}

/// A floating help button that can trigger tutorials
struct FloatingTutorialButton: View {
    // MARK: - Properties
    
    /// Action to perform when tapped
    let action: () -> Void
    
    /// Optional label to display next to the button
    let label: String?
    
    /// Size of the button
    let size: CGFloat
    
    /// Whether to show the pulsing animation
    let showPulseAnimation: Bool
    
    // MARK: - States
    
    @State private var isPulsing = false
    
    // MARK: - Initializer
    
    init(
        action: @escaping () -> Void,
        label: String? = nil,
        size: CGFloat = 44,
        showPulseAnimation: Bool = true
    ) {
        self.action = action
        self.label = label
        self.size = size
        self.showPulseAnimation = showPulseAnimation
    }
    
    // MARK: - Body
    
    var body: some View {
        HStack(spacing: 8) {
            // Optional label
            if let label = label {
                Text(label)
                    .font(.callout)
                    .foregroundColor(.primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.systemBackground))
                            .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                    )
            }
            
            // Help button
            ZStack {
                // Pulsing circle animation
                if showPulseAnimation {
                    Circle()
                        .fill(Color.blue.opacity(0.3))
                        .frame(width: size * 1.5, height: size * 1.5)
                        .scaleEffect(isPulsing ? 1.2 : 1.0)
                        .opacity(isPulsing ? 0 : 0.5)
                }
                
                // Main button
                Button(action: action) {
                    Image(systemName: "questionmark.circle.fill")
                        .font(.system(size: size * 0.6))
                        .foregroundColor(.white)
                        .frame(width: size, height: size)
                        .background(Circle().fill(Color.blue))
                        .shadow(color: Color.black.opacity(0.2), radius: 3, x: 0, y: 2)
                }
                .accessibilityIdentifier("HelpButton")
            }
        }
        .onAppear {
            if showPulseAnimation {
                withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                    isPulsing = true
                }
            }
        }
    }
}

// MARK: - Previews

struct TutorialButtonView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            TutorialButtonView(title: "Primary Button", style: .primary) {}
            TutorialButtonView(title: "Secondary Button", style: .secondary) {}
            TutorialButtonView(title: "Tertiary Button", style: .tertiary) {}
            TutorialButtonView(title: "Disabled Button", isDisabled: true) {}
            
            Divider()
                .padding(.vertical)
            
            FloatingTutorialButton(action: {}, label: "Need help?")
            FloatingTutorialButton(action: {})
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}