import SwiftUI

/// A view that displays an attention map image loaded from a URL
struct AttentionMapView: View {
    /// The URL of the attention map image to display
    let url: String
    
    /// The title to display above the image
    var title: String = "AI Attention Map"
    
    /// The description to display below the image
    var description: String = "Areas highlighted are regions the AI focused on for analysis"
    
    /// Animation state
    @State private var isImageLoaded = false
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    
    // For loading remote images
    @State private var uiImage: UIImage? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            
            ZStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.2)
                        .frame(height: 200)
                        .frame(maxWidth: .infinity)
                }
                
                if let error = errorMessage {
                    VStack {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        
                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
                    .frame(height: 200)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
                
                if let image = uiImage {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.purple.opacity(0.5), lineWidth: 1)
                        )
                        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
                        .opacity(isImageLoaded ? 1.0 : 0.0)
                        .animation(.easeIn(duration: 0.3), value: isImageLoaded)
                        .frame(maxHeight: 250)
                }
            }
            
            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
                .opacity(isImageLoaded ? 0.8 : 0.0)
                .animation(.easeIn(duration: 0.3).delay(0.1), value: isImageLoaded)
        }
        .padding(.vertical, 8)
        .onAppear {
            loadImage()
        }
    }
    
    /// Load the image from the URL
    private func loadImage() {
        guard let imageURL = URL(string: url) else {
            isLoading = false
            errorMessage = "Invalid image URL"
            return
        }
        
        URLSession.shared.dataTask(with: imageURL) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                
                if let error = error {
                    errorMessage = "Failed to load image: \(error.localizedDescription)"
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    errorMessage = "Server error: Invalid response"
                    return
                }
                
                guard let data = data, let image = UIImage(data: data) else {
                    errorMessage = "Could not decode image"
                    return
                }
                
                uiImage = image
                withAnimation {
                    isImageLoaded = true
                }
            }
        }.resume()
    }
}

struct AttentionMapView_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            // Preview with a sample URL (this would be a real URL in production)
            AttentionMapView(
                url: "https://api.symptomsentry.com/attention_maps/sample.png",
                title: "AI Attention Map",
                description: "Areas highlighted are regions the AI focused on for analysis"
            )
            .padding()
            
            // Preview with error state
            AttentionMapView(
                url: "invalid-url",
                title: "AI Attention Map",
                description: "Areas highlighted are regions the AI focused on for analysis"
            )
            .padding()
        }
    }
}