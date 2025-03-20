import SwiftUI
import Foundation

/// Animation Utility for managing app-wide animations
struct AnimationUtility {
    // MARK: - Animation Constants
    
    /// Standard durations
    struct Duration {
        static let short: Double = 0.3
        static let medium: Double = 0.5
        static let long: Double = 0.8
    }
    
    /// Animation curves
    struct Curve {
        static let standard = Animation.easeInOut(duration: Duration.medium)
        static let spring = Animation.spring(response: 0.55, dampingFraction: 0.7)
        static let gentle = Animation.easeInOut(duration: Duration.medium).delay(0.1)
        static let energetic = Animation.spring(response: 0.45, dampingFraction: 0.6)
        static let heartbeat = Animation.easeInOut(duration: 0.35)
        static let pulse = Animation.easeInOut(duration: Duration.short).repeatCount(1, autoreverses: true)
    }
    
    // MARK: - Transition Effects
    
    /// Health-themed transitions
    struct Transition {
        static let slide = AnyTransition.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
        
        static let scale = AnyTransition.scale(scale: 0.9)
            .combined(with: .opacity)
        
        static let heartbeat = AnyTransition.modifier(
            active: HeartbeatEffect(scale: 1.05),
            identity: HeartbeatEffect(scale: 1.0)
        )
        
        static let pulse = AnyTransition.modifier(
            active: PulseEffect(opacity: 0.3),
            identity: PulseEffect(opacity: 1.0)
        )
        
        static let wave = AnyTransition.asymmetric(
            insertion: AnyTransition.modifier(
                active: WaveEffect(amplitude: 0.2, frequency: 3, offset: 0),
                identity: WaveEffect(amplitude: 0, frequency: 0, offset: 0)
            ),
            removal: AnyTransition.opacity
        )
    }
}

// MARK: - Animation Modifiers

/// Creates a "breathing" effect
struct BreathingEffect: ViewModifier {
    @State private var breathing = false
    
    func body(content: Content) -> some View {
        content
            .scaleEffect(breathing ? 1.05 : 1)
            .opacity(breathing ? 0.9 : 1)
            .animation(
                Animation.easeInOut(duration: 1.5)
                    .repeatForever(autoreverses: true),
                value: breathing
            )
            .onAppear {
                breathing = true
            }
    }
}

/// Creates a "heartbeat" effect
struct HeartbeatEffect: AnimatableModifier {
    var scale: CGFloat
    
    var animatableData: CGFloat {
        get { scale }
        set { scale = newValue }
    }
    
    func body(content: Content) -> some View {
        content
            .scaleEffect(scale)
    }
}

/// Creates a "pulse" effect
struct PulseEffect: AnimatableModifier {
    var opacity: Double
    
    var animatableData: Double {
        get { opacity }
        set { opacity = newValue }
    }
    
    func body(content: Content) -> some View {
        content
            .opacity(opacity)
    }
}

/// Creates a "wave" effect
struct WaveEffect: GeometryEffect {
    var amplitude: CGFloat
    var frequency: CGFloat
    var offset: CGFloat
    
    var animatableData: CGFloat {
        get { offset }
        set { offset = newValue }
    }
    
    func effectValue(size: CGSize) -> ProjectionTransform {
        if amplitude == 0 {
            return ProjectionTransform(.identity)
        }
        
        let translationX = 0
        let translationY = amplitude * sin(frequency * offset * .pi)
        
        let affineTransform = CGAffineTransform(translationX: CGFloat(translationX), y: translationY)
        return ProjectionTransform(affineTransform)
    }
}

// MARK: - View Extension

extension View {
    /// Apply breathing animation effect
    func withBreathingAnimation() -> some View {
        self.modifier(BreathingEffect())
    }
    
    /// Apply a gentle bounce to a view when it appears
    func withAppearBounce() -> some View {
        self.transition(
            .asymmetric(
                insertion: .scale(scale: 0.9)
                    .combined(with: .opacity)
                    .animation(Animation.spring(response: 0.4, dampingFraction: 0.65)),
                removal: .opacity.animation(.easeOut(duration: 0.2))
            )
        )
    }
    
    /// Apply a slide-in animation when view appears
    func withSlideIn(from edge: Edge = .trailing) -> some View {
        self.transition(
            .asymmetric(
                insertion: .move(edge: edge)
                    .combined(with: .opacity)
                    .animation(Animation.spring(response: 0.5, dampingFraction: 0.7)),
                removal: .move(edge: edge.opposite)
                    .combined(with: .opacity)
                    .animation(.easeOut(duration: 0.3))
            )
        )
    }
    
    /// Apply a health-themed pulse effect
    func withPulseEffect() -> some View {
        self.transition(AnimationUtility.Transition.pulse)
    }
    
    /// Apply a heartbeat effect
    func withHeartbeatEffect() -> some View {
        self.transition(AnimationUtility.Transition.heartbeat)
    }
}

// MARK: - Helper Extensions

extension Edge {
    /// Get the opposite edge
    var opposite: Edge {
        switch self {
        case .top: return .bottom
        case .leading: return .trailing
        case .bottom: return .top
        case .trailing: return .leading
        }
    }
}