import SwiftUI

struct SubscriptionView: View {
    @EnvironmentObject var userService: UserService
    @State private var selectedPlan: SubscriptionPlanModel?
    @State private var showingPurchaseConfirmation = false
    @State private var processingPurchase = false
    @State private var purchaseError: String? = nil
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // User's current plan
                    if let user = userService.currentUser {
                        currentPlanView(for: user)
                    }
                    
                    // Available plans
                    Text("Choose a Plan")
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    VStack(spacing: 16) {
                        ForEach(SubscriptionPlanModel.allPlans) { plan in
                            SubscriptionPlanCard(
                                plan: plan,
                                isSelected: selectedPlan?.id == plan.id,
                                onSelect: {
                                    if user?.subscriptionLevel == .premium && plan.isFreePlan {
                                        // Confirm downgrade to free
                                        selectedPlan = plan
                                        showingPurchaseConfirmation = true
                                    } else if !plan.isFreePlan {
                                        // Upgrade to paid plan
                                        selectedPlan = plan
                                        showingPurchaseConfirmation = true
                                    }
                                },
                                isCurrentPlan: (user?.subscriptionLevel == .free && plan.isFreePlan) || 
                                              (user?.subscriptionLevel == .premium && !plan.isFreePlan)
                            )
                        }
                    }
                    .padding(.horizontal)
                    
                    // Premium features
                    premiumFeaturesView
                        .padding(.horizontal)
                    
                    // Purchase error message
                    if let error = purchaseError {
                        Text(error)
                            .font(.headline)
                            .foregroundColor(.red)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Subscription")
            .alert(isPresented: $showingPurchaseConfirmation) {
                Alert(
                    title: Text(selectedPlan?.isFreePlan == true ? "Downgrade to Free" : "Upgrade to Premium"),
                    message: Text(selectedPlan?.isFreePlan == true ? 
                        "Are you sure you want to downgrade? You'll lose access to premium features." : 
                        "Would you like to purchase the \(selectedPlan?.name ?? "") plan for \(selectedPlan?.formattedPrice ?? "")\(selectedPlan?.formattedBillingCycle ?? "")?"),
                    primaryButton: .default(Text(selectedPlan?.isFreePlan == true ? "Downgrade" : "Purchase")) {
                        processPurchase()
                    },
                    secondaryButton: .cancel()
                )
            }
            .overlay(
                Group {
                    if processingPurchase {
                        ZStack {
                            Color.black.opacity(0.4)
                            
                            VStack(spacing: 16) {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(1.5)
                                
                                Text("Processing...")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                        }
                        .edgesIgnoringSafeArea(.all)
                    }
                }
            )
        }
    }
    
    private var user: User? {
        return userService.currentUser
    }
    
    private func currentPlanView(for user: User) -> some View {
        VStack(spacing: 16) {
            Text("Your Current Plan")
                .font(.title2)
                .fontWeight(.bold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(user.subscriptionLevel == .free ? "Free" : "Premium")
                        .font(.headline)
                    
                    if user.subscriptionLevel == .free {
                        Text("\(user.analysesRemainingThisMonth()) of \(user.subscriptionLevel.maxAnalysesPerMonth) analyses remaining this month")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    } else {
                        Text("Unlimited analyses")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
                
                if user.subscriptionLevel == .premium {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .padding(12)
                        .background(Color.blue.opacity(0.2))
                        .clipShape(Circle())
                }
            }
            .padding()
            .background(Color(user.subscriptionLevel == .free ? "gray" : "blue").opacity(0.1))
            .cornerRadius(12)
        }
        .padding(.horizontal)
    }
    
    private var premiumFeaturesView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Premium Features")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 12) {
                PremiumFeatureRow(
                    icon: "infinity",
                    title: "Unlimited Analyses",
                    description: "Perform as many throat and ear analyses as you need"
                )
                
                PremiumFeatureRow(
                    icon: "doc.text.fill",
                    title: "Full Educational Library",
                    description: "Access our complete collection of medical articles"
                )
                
                PremiumFeatureRow(
                    icon: "chart.bar.fill",
                    title: "Detailed Health Reports",
                    description: "Get comprehensive information about potential conditions"
                )
                
                PremiumFeatureRow(
                    icon: "clock.fill",
                    title: "History Tracking",
                    description: "Monitor your condition over time with saved analyses"
                )
                
                PremiumFeatureRow(
                    icon: "person.fill.questionmark",
                    title: "Priority Support",
                    description: "Get faster responses to your questions and concerns"
                )
            }
            .padding()
            .background(Color.yellow.opacity(0.1))
            .cornerRadius(12)
        }
    }
    
    private func processPurchase() {
        guard let plan = selectedPlan else { return }
        
        processingPurchase = true
        purchaseError = nil
        
        // In a real app, this would integrate with App Store In-App Purchases
        // For now, simulate the process with a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            // Simulate successful purchase
            let newSubscriptionLevel: User.SubscriptionLevel = plan.isFreePlan ? .free : .premium
            
            userService.updateSubscription(to: newSubscriptionLevel) { success in
                processingPurchase = false
                
                if !success {
                    purchaseError = "Failed to update subscription. Please try again."
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct SubscriptionPlanCard: View {
    let plan: SubscriptionPlanModel
    let isSelected: Bool
    let onSelect: () -> Void
    let isCurrentPlan: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(plan.name)
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text("\(plan.formattedPrice)\(plan.formattedBillingCycle)")
                        .font(.headline)
                        .foregroundColor(plan.isFreePlan ? .gray : .blue)
                }
                
                Spacer()
                
                if isCurrentPlan {
                    Text("Current")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green)
                        .cornerRadius(10)
                }
                
                if !plan.isFreePlan {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                }
            }
            
            Divider()
            
            // Feature list
            VStack(alignment: .leading, spacing: 8) {
                ForEach(plan.features, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        
                        Text(feature)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                }
                
                ForEach(plan.notIncludedFeatures, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                        
                        Text(feature)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                }
            }
            
            Button(action: onSelect) {
                Text(getButtonTitle())
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(getButtonColor())
                    .cornerRadius(10)
            }
            .disabled(isCurrentPlan)
        }
        .padding()
        .background(isSelected ? Color.blue.opacity(0.05) : Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color.gray.opacity(0.3), lineWidth: isSelected ? 2 : 1)
        )
        .cornerRadius(12)
    }
    
    private func getButtonTitle() -> String {
        if isCurrentPlan {
            return "Current Plan"
        } else if plan.isFreePlan {
            return "Downgrade to Free"
        } else {
            return "Upgrade to \(plan.name)"
        }
    }
    
    private func getButtonColor() -> Color {
        if isCurrentPlan {
            return Color.gray
        } else if plan.isFreePlan {
            return Color.orange
        } else {
            return Color.blue
        }
    }
}

struct PremiumFeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .foregroundColor(.yellow)
                .font(.title2)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// Preview provider
struct SubscriptionView_Previews: PreviewProvider {
    static var previews: some View {
        SubscriptionView()
            .environmentObject(UserService.shared)
    }
}