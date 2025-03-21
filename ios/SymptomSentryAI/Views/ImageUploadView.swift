import SwiftUI
import UIKit
import PhotosUI

struct ImageUploadView: View {
    // MARK: - Environment & State
    
    /// Service for image validation
    @StateObject private var imageValidator = ImageValidationService()
    
    /// Service for ML analysis
    @StateObject private var analysisService = MLAnalysisService.shared
    
    /// Selected image
    @State private var selectedImage: UIImage?
    
    /// Current analysis type
    @State private var analysisType: MLAnalysisService.AnalysisType = .throat
    
    /// Photo picker selection
    @State private var photoPickerItem: PhotosPickerItem?
    
    /// Navigation state
    @State private var showResults = false
    @State private var isShowingCamera = false
    @State private var isShowingPhotoLibrary = false
    @State private var showingImageSourceOptions = false
    
    /// UI states
    @State private var uploadProgress: Double = 0
    @State private var showProgressView = false
    @State private var errorMessage: String?
    @State private var showError = false
    
    /// Animation states
    @State private var animateTypeSelection = false
    @State private var animateImagePreview = false
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Instructions
                instructionsSection
                
                // Type Selection
                typeSelectionSection
                    .padding(.vertical)
                    .opacity(animateTypeSelection ? 1 : 0)
                    .offset(y: animateTypeSelection ? 0 : 20)
                
                // Image Upload
                imageUploadSection
                
                // Analysis Button
                analyzeButtonSection
                    .opacity(selectedImage != nil ? 1 : 0.5)
                    .disabled(selectedImage == nil)
                
                // Error Message
                if let errorMessage = errorMessage, showError {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.red.opacity(0.1))
                        )
                        .padding(.horizontal)
                }
            }
            .padding()
        }
        .navigationTitle("Image Analysis")
        .onAppear {
            // Animate elements when view appears
            withAnimation(.easeInOut(duration: 0.5).delay(0.2)) {
                animateTypeSelection = true
            }
        }
        .sheet(isPresented: $isShowingCamera) {
            CameraViewController(image: $selectedImage, isShown: $isShowingCamera)
        }
        .photosPicker(
            isPresented: $isShowingPhotoLibrary,
            selection: $photoPickerItem,
            matching: .images
        )
        .onChange(of: photoPickerItem) { newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    selectedImage = uiImage
                    photoPickerItem = nil
                    
                    // Validate the image
                    let validationResult = await imageValidator.validateImage(uiImage)
                    if !validationResult.isValid {
                        errorMessage = validationResult.errorMessage
                        showError = true
                        selectedImage = nil
                    } else {
                        withAnimation {
                            animateImagePreview = true
                        }
                    }
                }
            }
        }
        .navigationDestination(isPresented: $showResults) {
            if let image = selectedImage,
               let analysis = analysisService.lastAnalysisResult {
                AnalysisResultsView(image: image, analysis: analysis)
            }
        }
        .alert(isPresented: $showError) {
            Alert(
                title: Text("Image Error"),
                message: Text(errorMessage ?? "Unknown error occurred"),
                dismissButton: .default(Text("OK")) {
                    errorMessage = nil
                    showError = false
                }
            )
        }
        .onChange(of: analysisService.analysisError) { error in
            if let error = error {
                errorMessage = error.localizedDescription
                showError = true
                showProgressView = false
            }
        }
        .onChange(of: analysisService.lastAnalysisResult) { result in
            if result != nil {
                showProgressView = false
                showResults = true
            }
        }
    }
    
    // MARK: - View Components
    
    private var instructionsSection: some View {
        VStack(spacing: 12) {
            Text("Select what you want to scan")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Choose an area to analyze, then take or upload a clear image for AI analysis.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
    
    private var typeSelectionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 15) {
                ForEach(MLAnalysisService.AnalysisType.allCases) { type in
                    AnalysisTypeButton(
                        type: type,
                        isSelected: analysisType == type,
                        action: { analysisType = type }
                    )
                }
            }
            
            // Best practices section - only appears after selection
            if let selectedType = MLAnalysisService.AnalysisType.allCases.first(where: { $0 == analysisType }) {
                bestPracticesSection(for: selectedType)
                    .transition(.opacity)
                    .animation(.easeInOut, value: analysisType)
            }
        }
    }
    
    private func bestPracticesSection(for type: MLAnalysisService.AnalysisType) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: type.iconName)
                    .foregroundColor(.blue)
                Text("\(type.displayName) Scan Selected")
                    .font(.headline)
            }
            .padding(.top, 8)
            
            Text(type == .throat ? 
                "Position the camera to clearly show the back of your throat." :
                "Gently pull your ear up and back to better expose the ear canal."
            )
            .font(.subheadline)
            .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("For best results:")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        BestPracticeBullet(text: "Ensure good lighting")
                        BestPracticeBullet(text: "Keep the camera steady")
                        BestPracticeBullet(text: "Focus on the area of concern")
                    }
                }
            }
            .padding(12)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            .padding(.top, 4)
        }
        .padding(.vertical, 8)
    }
    
    struct BestPracticeBullet: View {
        let text: String
        
        var body: some View {
            HStack(alignment: .top, spacing: 8) {
                Text("•")
                    .font(.subheadline)
                    .foregroundColor(.blue)
                Text(text)
                    .font(.subheadline)
            }
        }
    }
    
    private var imageUploadSection: some View {
        VStack(spacing: 25) {
            if let selectedImage = selectedImage {
                // Image preview
                Image(uiImage: selectedImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 250)
                    .cornerRadius(12)
                    .shadow(radius: 3)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
                    .opacity(animateImagePreview ? 1 : 0)
                    .scaleEffect(animateImagePreview ? 1 : 0.8)
                    .animation(.spring(), value: animateImagePreview)
                    .onAppear {
                        withAnimation {
                            animateImagePreview = true
                        }
                    }
                
                // Replace button
                Button(action: {
                    showingImageSourceOptions = true
                }) {
                    HStack {
                        Image(systemName: "arrow.triangle.2.circlepath")
                        Text("Replace Image")
                    }
                    .foregroundColor(.blue)
                    .padding(.vertical, 8)
                }
            } else {
                // Image upload options
                ZStack {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(Color(.systemGray6))
                        .frame(height: 200)
                    
                    VStack(spacing: 15) {
                        Image(systemName: "camera.fill")
                            .font(.largeTitle)
                            .foregroundColor(.blue)
                        
                        Button(action: {
                            showingImageSourceOptions = true
                        }) {
                            Text("Select Image")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 12)
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        .accessibilityIdentifier("SelectImageButton")
                    }
                }
            }
        }
        .confirmationDialog(
            "Choose Image Source",
            isPresented: $showingImageSourceOptions,
            titleVisibility: .visible
        ) {
            Button("Camera") {
                isShowingCamera = true
            }
            Button("Photo Library") {
                isShowingPhotoLibrary = true
            }
            Button("Cancel", role: .cancel) {}
        }
    }
    
    private var analyzeButtonSection: some View {
        VStack(spacing: 15) {
            if showProgressView {
                ProgressView("Analyzing image...", value: uploadProgress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle())
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                Button(action: {
                    analyzeImage()
                }) {
                    HStack {
                        Image(systemName: "waveform.path.ecg")
                        Text("Analyze Image")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .accessibilityIdentifier("AnalyzeImageButton")
            }
            
            Text("Free analysis remaining today: 3")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Methods
    
    /// Analyze the selected image
    private func analyzeImage() {
        guard let image = selectedImage else { return }
        
        showProgressView = true
        uploadProgress = 0.1
        
        // Simulate upload progress (in a real app, this would track actual upload progress)
        withAnimation {
            uploadProgress = 0.3
        }
        
        Timer.scheduledTimer(withTimeInterval: 0.8, repeats: false) { _ in
            withAnimation {
                uploadProgress = 0.6
            }
        }
        
        // Perform analysis
        let _ = analysisService.analyzeImage(image, type: analysisType)
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .finished:
                        break
                    case .failure(let error):
                        errorMessage = error.localizedDescription
                        showError = true
                        showProgressView = false
                    }
                },
                receiveValue: { _ in
                    withAnimation {
                        uploadProgress = 1.0
                    }
                    
                    // Navigation is handled by the onChange observer
                }
            )
    }
}

// MARK: - Supporting Views

/// Button for selecting analysis type
struct AnalysisTypeButton: View {
    let type: MLAnalysisService.AnalysisType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: type.iconName)
                    .font(.system(size: 24))
                    .foregroundColor(isSelected ? .white : .blue)
                
                Text(type.displayName)
                    .font(.subheadline)
                    .foregroundColor(isSelected ? .white : .primary)
                
                // Only show "Click to Select" text if not selected
                if !isSelected {
                    Text("Click to Select")
                        .font(.caption)
                        .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
                }
                
                Text(type.description)
                    .font(.caption)
                    .foregroundColor(isSelected ? .white.opacity(0.9) : .secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 4)
                    .lineLimit(2)
            }
            .frame(width: 150)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Camera view controller
struct CameraViewController: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Binding var isShown: Bool
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraViewController
        
        init(_ parent: CameraViewController) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.isShown = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isShown = false
        }
    }
}

// MARK: - Previews

struct ImageUploadView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ImageUploadView()
        }
    }
}