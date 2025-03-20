import SwiftUI

struct TutorialOverlayView: View {
    @ObservedObject var tutorialService = TutorialService.shared
    @Binding var selectedTab: Int
    var screenSize: CGSize
    
    var body: some View {
        ZStack {
            // Semitransparent background
            Color.black.opacity(0.75)
                .edgesIgnoringSafeArea(.all)
                .onTapGesture {
                    // Skip to next step if tapping outside highlighted area
                    tutorialService.nextStep()
                }
            
            // Current tutorial step
            if tutorialService.currentStep < tutorialService.tutorialSteps.count {
                let step = tutorialService.tutorialSteps[tutorialService.currentStep]
                
                // Tab highlighting
                if let highlightTab = step.highlightTab {
                    VStack {
                        Spacer()
                        
                        Rectangle()
                            .fill(Color.white.opacity(0.2))
                            .frame(width: screenSize.width / 5, height: 60)
                            .offset(x: calculateTabOffset(for: highlightTab, screenWidth: screenSize.width), y: 0)
                            .animation(.easeInOut(duration: 0.3))
                    }
                    .transition(.opacity)
                    .onAppear {
                        // Animate to the highlighted tab if needed
                        if selectedTab != highlightTab.index {
                            withAnimation {
                                selectedTab = highlightTab.index
                            }
                        }
                    }
                }
                
                // Tutorial content card
                VStack(spacing: 20) {
                    // Step indicator
                    HStack(spacing: 8) {
                        ForEach(0..<tutorialService.tutorialSteps.count, id: \.self) { index in
                            Circle()
                                .fill(index == tutorialService.currentStep ? Color.white : Color.gray.opacity(0.5))
                                .frame(width: 8, height: 8)
                        }
                    }
                    .padding(.top)
                    
                    // Icon
                    Image(systemName: step.imageName)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 60, height: 60)
                        .foregroundColor(.white)
                        .padding()
                    
                    // Title and description
                    Text(step.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    Text(step.description)
                        .font(.body)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Additional custom content
                    step.additionalContent
                    
                    // Navigation buttons
                    HStack(spacing: 20) {
                        // Skip button
                        Button(action: tutorialService.skipTutorial) {
                            Text("Skip Tour")
                                .foregroundColor(.white)
                                .padding(.vertical, 10)
                                .padding(.horizontal, 16)
                                .background(Color.gray.opacity(0.3))
                                .cornerRadius(8)
                        }
                        
                        Spacer()
                        
                        // Previous button (if not first step)
                        if tutorialService.currentStep > 0 {
                            Button(action: tutorialService.previousStep) {
                                Image(systemName: "chevron.left")
                                    .foregroundColor(.white)
                                    .padding(10)
                                    .background(Color.blue.opacity(0.3))
                                    .clipShape(Circle())
                            }
                        }
                        
                        // Next/Finish button
                        Button(action: tutorialService.nextStep) {
                            Text(tutorialService.currentStep == tutorialService.tutorialSteps.count - 1 ? "Finish" : "Next")
                                .foregroundColor(.white)
                                .padding(.vertical, 10)
                                .padding(.horizontal, 16)
                                .background(Color.blue)
                                .cornerRadius(8)
                        }
                    }
                    .padding(.bottom)
                }
                .padding()
                .background(Color(UIColor.systemBackground).opacity(0.2))
                .cornerRadius(16)
                .shadow(radius: 5)
                .frame(width: min(screenSize.width - 40, 400))
                .padding(.horizontal, 20)
                .transition(AnyTransition.opacity.combined(with: .scale))
                .animation(.easeInOut)
                .position(calculatePosition(for: step, in: screenSize))
            }
        }
        .edgesIgnoringSafeArea(.all)
    }
    
    // MARK: - Helper Methods
    
    private func calculatePosition(for step: TutorialStep, in screenSize: CGSize) -> CGPoint {
        // If a specific highlight frame exists, position near that
        if let highlightFrame = step.highlightFrame {
            // Position above or below the highlight depending on space available
            let centerX = highlightFrame.midX
            let centerY = highlightFrame.minY > screenSize.height / 2 
                ? highlightFrame.minY - 100 // Place above
                : highlightFrame.maxY + 100 // Place below
            
            return CGPoint(x: centerX, y: centerY)
        }
        
        // Default positioning based on alignment
        switch step.alignment {
        case .top:
            return CGPoint(x: screenSize.width / 2, y: screenSize.height * 0.25)
        case .bottom:
            return CGPoint(x: screenSize.width / 2, y: screenSize.height * 0.75)
        case .leading:
            return CGPoint(x: screenSize.width * 0.25, y: screenSize.height / 2)
        case .trailing:
            return CGPoint(x: screenSize.width * 0.75, y: screenSize.height / 2)
        default:
            return CGPoint(x: screenSize.width / 2, y: screenSize.height / 2)
        }
    }
    
    private func calculateTabOffset(for tab: TutorialStep.TabSelection, screenWidth: CGFloat) -> CGFloat {
        let tabWidth = screenWidth / 5
        let centerOffset = (tab.index - 2) * Int(tabWidth)
        return CGFloat(centerOffset)
    }
}

// MARK: - Preview

struct TutorialOverlayView_Previews: PreviewProvider {
    @State static var selectedTab = 0
    
    static var previews: some View {
        TutorialOverlayView(
            selectedTab: $selectedTab,
            screenSize: CGSize(width: 375, height: 812)
        )
    }
}